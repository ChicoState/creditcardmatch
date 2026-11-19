// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deriveSurveySubmission } from '../../lib/config/survey';
import { saveSurveyAnswersAction } from '../../lib/account/actions';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  upsert: vi.fn(),
  insert: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('../../lib/auth/server', () => ({
  createAuthAdminClient: vi.fn(),
  createAuthServerClient: async () => ({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  }),
}));

function validSubmission() {
  return deriveSurveySubmission({
    acceptsAnnualFee: false,
    categorySpend: { groceries: '250' },
    creditScore: 'good',
    extraBenefits: [],
    incomeRange: '40001_to_60000',
    primaryGoal: 'cash_back',
    priorityCategories: ['groceries'],
  });
}

describe('survey save input boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'session-owner' } },
      error: null,
    });
    mocks.upsert.mockResolvedValue({ error: null });
    mocks.insert.mockResolvedValue({ error: null });
    mocks.from.mockImplementation((table: string) => ({
      upsert: mocks.upsert,
      insert: mocks.insert,
      delete: () => ({ eq: async () => ({ error: null }) }),
      select: async () => ({
        error: null,
        data:
          table === 'reward_categories'
            ? [{ category_id: 1, slug: 'groceries' }]
            : [
                { filter_id: 2, slug: 'cashback' },
                { filter_id: 3, slug: 'no-annual-fee' },
              ],
      }),
    }));
  });

  it.each([
    ['null input', null],
    [
      'null nested spending',
      { ...validSubmission(), category_monthly_spend: [null] },
    ],
    [
      'null nested filter',
      { ...validSubmission(), user_filter_preferences: [null] },
    ],
    [
      'duplicate filters',
      {
        ...validSubmission(),
        user_filter_preferences: [
          validSubmission().user_filter_preferences[0],
          validSubmission().user_filter_preferences[0],
        ],
      },
    ],
    [
      'incomplete spending',
      { ...validSubmission(), category_monthly_spend: [] },
    ],
    [
      'unexpected fields',
      { ...validSubmission(), injected: 'must not be persisted' },
    ],
  ])(
    'returns a controlled error for %s before database access',
    async (_label, payload) => {
      await expect(saveSurveyAnswersAction(payload)).resolves.toEqual({
        ok: false,
        error: 'Those survey answers are invalid.',
      });
      expect(mocks.getUser).not.toHaveBeenCalled();
      expect(mocks.from).not.toHaveBeenCalled();
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    },
  );

  it('continues to require authentication for valid submissions', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(saveSurveyAnswersAction(validSubmission())).resolves.toEqual({
      ok: false,
      requiresAuth: true,
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('saves a valid snapshot and related rows for the session owner', async () => {
    const submission = validSubmission();
    await expect(saveSurveyAnswersAction(submission)).resolves.toEqual({
      ok: true,
    });
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'session-owner',
        survey_answers: submission,
      }),
      { onConflict: 'user_id' },
    );
    expect(mocks.insert).toHaveBeenCalledWith([
      { user_id: 'session-owner', category_id: 1, monthly_amount: 250 },
    ]);
    expect(mocks.insert).toHaveBeenCalledWith([
      { user_id: 'session-owner', filter_id: 2, preference: 'want' },
      { user_id: 'session-owner', filter_id: 3, preference: 'want' },
    ]);
  });
});
