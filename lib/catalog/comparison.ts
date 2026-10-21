import type { CatalogCard, CatalogSnapshot, RewardCapPeriod } from './types';
import { selectVisibleCatalogCards } from './visibility';

export interface ComparisonReward {
  categoryId: number;
  categoryName: string;
  displayOrder: number;
  rate: number;
  spendCap: number | null;
  capPeriod: RewardCapPeriod | null;
  rateAfterCap: number | null;
  notes: string | null;
}

export interface ComparisonCard extends CatalogCard {
  introOffer: string | null;
  rewards: ComparisonReward[];
}

export function selectComparisonCards(
  catalog: CatalogSnapshot,
): ComparisonCard[] {
  const rows = new Map(catalog.creditCards.map((card) => [card.card_id, card]));
  const categories = new Map(
    catalog.rewardCategories.map((category) => [
      category.category_id,
      category,
    ]),
  );

  return selectVisibleCatalogCards(catalog).map((card) => ({
    ...card,
    introOffer: rows.get(card.cardId)?.intro_offer ?? null,
    rewards: catalog.cardRewards
      .filter((reward) => reward.card_id === card.cardId)
      .flatMap((reward) => {
        const category = categories.get(reward.category_id);
        return category
          ? [
              {
                categoryId: category.category_id,
                categoryName: category.category_name,
                displayOrder: category.display_order,
                rate: reward.reward_rate,
                spendCap: reward.spend_cap,
                capPeriod: reward.cap_period,
                rateAfterCap: reward.rate_after_cap,
                notes: reward.notes,
              },
            ]
          : [];
      })
      .sort((a, b) => a.displayOrder - b.displayOrder),
  }));
}
