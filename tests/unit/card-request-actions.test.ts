import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  check: vi.fn(),
  rpc: vi.fn(),
  insert: vi.fn(),
  single: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
vi.mock('../../lib/auth/server', () => ({
  createAuthServerClient: async () => ({
    auth: { getUser: mocks.getUser },
    rpc: mocks.check,
  }),
  createAuthAdminClient: () => ({
    rpc: mocks.rpc,
    from: () => ({ insert: mocks.insert }),
  }),
}));
vi.mock('../../lib/data/catalog', () => ({
  getCatalogData: async () => ({
    filters: [{ filter_id: 1 }],
    rewardCategories: [{ category_id: 2 }],
  }),
}));
import {
  submitCardRequest,
  reviewCardRequest,
} from '../../lib/card-requests/actions';
const input = {
  card_name: 'Test',
  issuer: 'Bank',
  source_url: 'https://example.com',
  filter_ids: [1],
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({
    data: { user: { id: 'owner' } },
    error: null,
  });
  mocks.check.mockResolvedValue({ data: true });
  mocks.rpc.mockResolvedValue({ error: null });
  mocks.insert.mockReturnValue({ select: () => ({ single: mocks.single }) });
  mocks.single.mockResolvedValue({ data: { request_id: 1 }, error: null });
});
describe('request operations', () => {
  it('requires authentication for submission and admin access for review', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    expect(await submitCardRequest(input)).toMatchObject({
      ok: false,
      code: 'unauthorized',
    });
    expect(
      await reviewCardRequest({
        requestId: 1,
        revision: 0,
        action: 'deny',
        note: 'No',
      }),
    ).toMatchObject({ ok: false, code: 'forbidden' });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('does not trust caller-provided ownership or decision metadata', async () => {
    expect(
      await submitCardRequest({
        ...input,
        user_id: 'attacker',
        status: 'approved',
        reviewed_by: 'attacker',
      }),
    ).toEqual({ ok: true, requestId: 1 });
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'owner', status: 'pending' }),
    );
    expect(mocks.insert.mock.calls[0][0]).not.toHaveProperty('reviewed_by');
  });
  it('rejects non-admin review and invalid publication without a write', async () => {
    mocks.check.mockResolvedValue({ data: false });
    expect(
      await reviewCardRequest({
        requestId: 1,
        revision: 0,
        action: 'save',
        details: input,
      }),
    ).toMatchObject({ ok: false, code: 'forbidden' });
    mocks.check.mockResolvedValue({ data: true });
    expect(
      await reviewCardRequest({
        requestId: 1,
        revision: 0,
        action: 'publish',
        details: input,
      }),
    ).toMatchObject({ ok: false, code: 'validation' });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('passes authenticated actor and revision to the transaction and reports stale conflicts', async () => {
    mocks.rpc.mockResolvedValue({ error: { code: '40001' } });
    expect(
      await reviewCardRequest({
        requestId: 5,
        revision: 2,
        action: 'deny',
        note: ' Duplicate ',
      }),
    ).toMatchObject({ ok: false, code: 'conflict' });
    expect(mocks.rpc).toHaveBeenCalledWith(
      'review_card_request',
      expect.objectContaining({
        p_actor: 'owner',
        p_request: 5,
        p_revision: 2,
        p_note: 'Duplicate',
      }),
    );
  });
  it('allows incomplete draft saves but requires a denial note', async () => {
    expect(
      await reviewCardRequest({
        requestId: 1,
        revision: 0,
        action: 'save',
        details: {},
      }),
    ).toEqual({ ok: true });
    expect(
      await reviewCardRequest({ requestId: 1, revision: 1, action: 'deny' }),
    ).toMatchObject({ ok: false, code: 'validation' });
  });
  it('hides database errors and refreshes after successful decisions', async () => {
    expect(
      await reviewCardRequest({
        requestId: 1,
        revision: 0,
        action: 'link',
        cardId: 3,
      }),
    ).toEqual({ ok: true });
    expect(mocks.revalidate).toHaveBeenCalledWith('/results');
    mocks.rpc.mockResolvedValue({ error: { message: 'secret' } });
    expect(
      await reviewCardRequest({
        requestId: 1,
        revision: 0,
        action: 'link',
        cardId: 3,
      }),
    ).toMatchObject({
      ok: false,
      code: 'persistence',
      message: expect.not.stringContaining('secret'),
    });
  });
});
