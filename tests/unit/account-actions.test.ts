// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import {
  addCardAction,
  saveAccountDetails,
  saveCardRosterAction,
} from '../../lib/account/actions';

const mocks = vi.hoisted(() => {
  const getUser = vi.fn();
  const from = vi.fn();
  const authClient = {
    auth: {
      getUser,
      signInWithPassword: vi.fn(),
      updateUser: vi.fn(),
    },
    from,
    storage: { from: vi.fn() },
  };
  return {
    authClient,
    createAuthServerClient: vi.fn(),
    getCatalogData: vi.fn(),
    getUser,
    from,
    signInWithPassword: authClient.auth.signInWithPassword,
    updateUser: authClient.auth.updateUser,
    updateUserById: vi.fn(),
    upload: vi.fn(),
    remove: vi.fn(),
    revalidatePath: vi.fn(),
  };
});

vi.mock('../../lib/auth/rate-limit', () => ({
  consumeAuthRateLimit: async () => true,
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('../../lib/auth/server', () => ({
  createAuthAdminClient: () => ({
    auth: { admin: { updateUserById: mocks.updateUserById } },
  }),
  createAuthServerClient: mocks.createAuthServerClient,
}));
vi.mock('../../lib/data/catalog', () => ({
  getCatalogData: mocks.getCatalogData,
}));
vi.mock('../../lib/catalog/visibility', () => ({
  selectVisibleCatalogCards: vi.fn(() => [{ cardId: 7 }]),
}));

describe('card roster actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createAuthServerClient.mockResolvedValue(mocks.authClient);
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mocks.getCatalogData.mockResolvedValue({});
    mocks.from.mockImplementation(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }));
  });

  it('creates the profile before adding a card for a new account', async () => {
    const formData = new FormData();
    formData.set('card_id', '7');
    const upsertedTables: string[] = [];
    mocks.from.mockImplementation((table: string) => ({
      upsert: vi.fn().mockImplementation(() => {
        upsertedTables.push(table);
        return Promise.resolve({ error: null });
      }),
    }));
    await addCardAction(formData);
    expect(upsertedTables).toEqual(['profiles', 'user_card_roster']);
  });

  it('replaces the authenticated user roster with visible catalog cards', async () => {
    const deleteQuery = { eq: vi.fn() };
    deleteQuery.eq.mockResolvedValue({ error: null });
    const insert = vi.fn().mockResolvedValue({ error: null });
    mocks.from.mockImplementation((table: string) => {
      if (table === 'user_card_roster')
        return { delete: vi.fn(() => deleteQuery), insert };
      return { upsert: vi.fn().mockResolvedValue({ error: null }) };
    });
    const formData = new FormData();
    formData.append('card_id', '7');
    formData.append('card_id', '8');
    await saveCardRosterAction(formData);
    expect(insert).toHaveBeenCalledWith([{ user_id: 'user-1', card_id: 7 }]);
  });
});

describe('account save authorization and failure recovery', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createAuthServerClient.mockResolvedValue(mocks.authClient);
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id,
          email: 'internal@accounts.invalid',
          user_metadata: {
            username: 'login',
            avatar_path: `${id}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp`,
          },
        },
      },
    });
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: { id } },
      error: null,
    });
    mocks.updateUser.mockResolvedValue({ error: null });
    mocks.updateUserById.mockResolvedValue({ error: null });
    mocks.upload.mockResolvedValue({ error: null });
    mocks.remove.mockResolvedValue({ error: null });
    mocks.authClient.storage.from.mockReturnValue({
      upload: mocks.upload,
      remove: mocks.remove,
    });
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
  function passwordForm(password = 'newpass2', confirmation = password) {
    const form = fields('password', '');
    form.set('currentPassword', 'oldpass1');
    form.set('password', password);
    form.set('confirmation', confirmation);
    return form;
  }
  it('changes password after verifying the current password', async () => {
    expect(await saveAccountDetails(passwordForm())).toEqual({ success: true });
    expect(mocks.updateUser).toHaveBeenCalledWith({
      password: 'newpass2',
      current_password: 'oldpass1',
    });
  });
  it('rejects wrong current passwords without updating', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: {},
    });
    expect(await saveAccountDetails(passwordForm())).toHaveProperty('error');
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
  it('rejects weak or mismatched new passwords before verifying', async () => {
    for (const form of [
      passwordForm('short'),
      passwordForm('nodigitsplease'),
      passwordForm('newpass2', 'otherpass3'),
    ])
      expect(await saveAccountDetails(form)).toHaveProperty('error');
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
  it('rejects the removed display name field', async () => {
    expect(
      await saveAccountDetails(fields('name', 'Other name')),
    ).toHaveProperty('error');
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
  function usernameForm(value = 'new_login') {
    const form = fields('username', value);
    form.set('currentPassword', 'oldpass1');
    form.set('userId', 'someone-else');
    return form;
  }
  it('updates the session owner’s login identity and username together', async () => {
    expect(await saveAccountDetails(usernameForm())).toEqual({ success: true });
    expect(mocks.updateUserById).toHaveBeenCalledWith(id, {
      email: '6e65775f6c6f67696e@accounts.invalid',
      email_confirm: true,
      user_metadata: { username: 'new_login' },
    });
  });
  it('rejects invalid usernames and incorrect passwords without admin writes', async () => {
    expect(await saveAccountDetails(usernameForm('bad name'))).toHaveProperty(
      'error',
    );
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: {},
    });
    expect(await saveAccountDetails(usernameForm())).toHaveProperty('error');
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });
  it('reports a taken username without claiming success', async () => {
    mocks.updateUserById.mockResolvedValue({ error: { code: 'email_exists' } });
    expect(await saveAccountDetails(usernameForm())).toEqual({
      error: 'Username already taken.',
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
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
