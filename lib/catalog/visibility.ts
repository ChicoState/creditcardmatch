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
      slug: card.slug,
      issuer: card.issuer,
      cardName: card.card_name,
      network: card.network,
      pointValueCents: card.point_value_cents,
      annualFee: card.annual_fee,
      annualFeeWaivedFirstYear: card.annual_fee_waived_first_year,
      oneTimeFee: card.one_time_fee,
      monthlyFee: card.monthly_fee,
      foreignTransactionFeePercent: card.foreign_transaction_fee_percent,
      isSecured: card.is_secured,
      securityDepositMin: card.security_deposit_min,
      applyUrl: card.apply_url,
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
