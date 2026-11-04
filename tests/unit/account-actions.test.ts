import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authClient, createAuthServerClient, getCatalogData } = vi.hoisted(
  () => ({
    authClient: {
      auth: { getUser: vi.fn() },
      from: vi.fn(),
    },
    createAuthServerClient: vi.fn(),
    getCatalogData: vi.fn(),
  }),
);

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('../../lib/auth/server', () => ({ createAuthServerClient }));
vi.mock('../../lib/data/catalog', () => ({ getCatalogData }));
vi.mock('../../lib/catalog/visibility', () => ({
  selectVisibleCatalogCards: vi.fn(() => [{ cardId: 7 }]),
}));

import { addCardAction, saveCardRosterAction } from '../../lib/account/actions';

describe('addCardAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAuthServerClient.mockResolvedValue(authClient);
    authClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    });
    getCatalogData.mockResolvedValue({});
    authClient.from.mockImplementation(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }));
  });

  it('creates the profile before adding a card for a new account', async () => {
    const formData = new FormData();
    formData.set('card_id', '7');
    const upsertedTables: string[] = [];
    authClient.from.mockImplementation((table: string) => ({
      upsert: vi.fn().mockImplementation(() => {
        upsertedTables.push(table);
        return Promise.resolve({ error: null });
      }),
    }));

    await addCardAction(formData);

    expect(upsertedTables).toEqual(['profiles', 'user_card_roster']);
  });
});

describe('saveCardRosterAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAuthServerClient.mockResolvedValue(authClient);
    authClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    });
    getCatalogData.mockResolvedValue({});
  });

  it('replaces the authenticated user roster with visible catalog cards', async () => {
    const deleteQuery = { eq: vi.fn() };
    deleteQuery.eq.mockResolvedValue({ error: null });
    const insert = vi.fn().mockResolvedValue({ error: null });
    authClient.from.mockImplementation((table: string) => {
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
