import { redirect } from 'next/navigation';

import { getCatalogData } from '../data/catalog';
import { createAuthServerClient } from '../auth/server';
import { selectVisibleCatalogCards } from '../catalog/visibility';
import type { CatalogCard } from '../catalog/types';
import type { AccountDashboardData } from './types';

export async function getAuthenticatedUser(nextPath = '/account') {
  const { data, error } = await (await createAuthServerClient()).auth.getUser();
  if (error || !data.user) redirect(`/login?next=${nextPath}`);
  return data.user;
}

export async function getAccountDashboardData(): Promise<AccountDashboardData> {
  const user = await getAuthenticatedUser();
  const auth = await createAuthServerClient();

  const [rosterResult, spendResult, catalog] = await Promise.all([
    auth.from('user_card_roster').select('card_id').eq('user_id', user.id),
    auth
      .from('user_category_spend')
      .select('category_id, monthly_amount')
      .eq('user_id', user.id),
    getCatalogData(),
  ]);

  if (rosterResult.error) throw new Error('Unable to load your card roster.');
  if (spendResult.error)
    throw new Error('Unable to load your saved spending answers.');

  const visibleCards = selectVisibleCatalogCards(catalog);
  const rosterIds = new Set(
    (rosterResult.data ?? []).map((row) => Number(row.card_id)),
  );
  const roster = visibleCards.filter((card) => rosterIds.has(card.cardId));
  const availableCards = visibleCards;

  const categoryById = new Map(
    catalog.rewardCategories.map((category) => [
      category.category_id,
      category.category_name,
    ]),
  );
  const spend = (spendResult.data ?? [])
    .flatMap((row) => {
      const categoryName = categoryById.get(Number(row.category_id));
      return categoryName
        ? [
            {
              categoryName,
              monthlyAmount: Number(row.monthly_amount),
            },
          ]
        : [];
    })
    .sort((left, right) => right.monthlyAmount - left.monthlyAmount);

  return {
    username:
      typeof user.user_metadata?.username === 'string'
        ? user.user_metadata.username
        : 'Username unavailable',
    roster,
    availableCards,
    rewardCategories: catalog.rewardCategories,
    spend,
  };
}

export function availableRosterCards(
  cards: CatalogCard[],
  roster: CatalogCard[],
): CatalogCard[] {
  const rosterIds = new Set(roster.map((card) => card.cardId));
  return cards.filter((card) => !rosterIds.has(card.cardId));
}
