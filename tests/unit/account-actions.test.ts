// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import { saveAccountDetails } from '../../lib/account/actions';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  updateUser: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('../../lib/auth/server', () => ({
  createAuthServerClient: async () => ({
    auth: { getUser: mocks.getUser, updateUser: mocks.updateUser },
    storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove }) },
  }),
}));

describe('account save authorization and failure recovery', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id,
          user_metadata: {
            username: 'login',
            avatar_path: `${id}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp`,
          },
        },
      },
    });
    mocks.updateUser.mockResolvedValue({ error: null });
    mocks.upload.mockResolvedValue({ error: null });
    mocks.remove.mockResolvedValue({ error: null });
  });
  function fields(field: string, value: string) {
    const form = new FormData();
    form.set('field', field);
    form.set('value', value);
    return form;
  }
  async function photo() {
    const bytes = await sharp({
      create: { width: 2, height: 2, channels: 3, background: '#155c45' },
    })
      .png()
      .toBuffer();
    const form = new FormData();
    form.set('field', 'photo');
    form.set(
      'photo',
      new File([new Uint8Array(bytes)], 'photo.png', { type: 'image/png' }),
    );
    return form;
  }
  it('rejects expired sessions without writing', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    expect(await saveAccountDetails(fields('name', 'New name'))).toHaveProperty(
      'error',
    );
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it('only updates the chosen presentation field and refreshes the header', async () => {
    const form = fields('name', ' New name ');
    form.set('userId', 'someone-else');
    expect(await saveAccountDetails(form)).toEqual({ success: true });
    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: { display_name: 'New name' },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });
  it('allows clearing contact email', async () => {
    expect(await saveAccountDetails(fields('email', ''))).toEqual({
      success: true,
    });
    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: { contact_email: '' },
    });
  });
  it('rejects malformed or unknown fields without writing', async () => {
    expect(await saveAccountDetails(fields('email', 'bad'))).toHaveProperty(
      'error',
    );
    expect(await saveAccountDetails(fields('username', 'bad'))).toHaveProperty(
      'error',
    );
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
  it('uploads under the authenticated owner and removes the old photo after saving', async () => {
    expect(await saveAccountDetails(await photo())).toEqual({ success: true });
    const path = mocks.upload.mock.calls[0][0];
    expect(path).toMatch(new RegExp(`^${id}/.+\\.webp$`));
    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: { avatar_path: path },
    });
    expect(mocks.remove).toHaveBeenCalledWith([
      `${id}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp`,
    ]);
  });
  it('removes only the new upload when metadata saving fails', async () => {
    mocks.updateUser.mockResolvedValue({ error: new Error('failure') });
    expect(await saveAccountDetails(await photo())).toHaveProperty('error');
    expect(mocks.remove).toHaveBeenCalledWith([mocks.upload.mock.calls[0][0]]);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
  it('does not replace metadata when upload fails', async () => {
    mocks.upload.mockResolvedValue({ error: new Error('failure') });
    expect(await saveAccountDetails(await photo())).toHaveProperty('error');
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
});
