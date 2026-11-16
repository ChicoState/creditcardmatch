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

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('../../lib/auth/server', () => ({ createAuthServerClient }));
vi.mock('../../lib/data/catalog', () => ({ getCatalogData }));
vi.mock('../../lib/catalog/visibility', () => ({
  selectVisibleCatalogCards: vi.fn((catalog) => catalog.cards),
}));

import { getCurrentCardsPageData } from '../../lib/account/data';

describe('getCurrentCardsPageData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAuthServerClient.mockResolvedValue(authClient);
    authClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', user_metadata: { username: 'alex' } } },
    });
    authClient.from.mockImplementation((table: string) => {
      if (table === 'user_card_roster') {
        return {
          select: vi.fn(() => ({
            eq: vi
              .fn()
              .mockResolvedValue({ data: [{ card_id: 7 }], error: null }),
          })),
        };
      }
      throw new Error(`Unexpected database table: ${table}`);
    });
    getCatalogData.mockResolvedValue({
      cards: [
        {
          cardId: 7,
          cardName: 'Test Card',
          issuer: 'Test issuer',
          isActive: true,
        },
      ],
      rewardCategories: [],
    });
  });

  it('loads current cards without querying saved spending answers', async () => {
    await expect(getCurrentCardsPageData()).resolves.toMatchObject({
      roster: [{ cardId: 7 }],
      availableCards: [{ cardId: 7 }],
      rewardCategories: [],
    });

    expect(authClient.from).toHaveBeenCalledTimes(1);
    expect(authClient.from).toHaveBeenCalledWith('user_card_roster');
  });
});
