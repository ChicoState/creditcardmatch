import type { CatalogCard, CatalogSnapshot } from './types';

export function selectVisibleCatalogCards(
  catalog: CatalogSnapshot,
): CatalogCard[] {
  const filterSlugById = new Map(
    catalog.filters.map((filter) => [filter.filter_id, filter.slug]),
  );

  return catalog.creditCards
    .filter((card) => card.is_active)
    .map((card) => ({
      cardId: card.card_id,
      issuer: card.issuer,
      cardName: card.card_name,
      annualFee: card.annual_fee,
      imageUrl: card.image_url,
      description: card.description,
      rewardType: card.reward_type,
      creditLevelRequired: card.credit_level_required,
      isVerified: card.is_verified,
      benefits: catalog.cardBenefits
        .filter((benefit) => benefit.card_id === card.card_id)
        .sort((left, right) => left.sort_order - right.sort_order)
        .map((benefit) => benefit.description),
      filterSlugs: catalog.cardFilters
        .filter((cardFilter) => cardFilter.card_id === card.card_id)
        .map((cardFilter) => filterSlugById.get(cardFilter.filter_id))
        .filter((slug): slug is string => Boolean(slug)),
    }));
}
