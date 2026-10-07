import type { CatalogCard } from './types';

export function filterCards(
  cards: CatalogCard[],
  activeFilters: string[],
): CatalogCard[] {
  // TODO(TBD): Decide whether Cashback remains card_filters membership or is
  // derived from reward_type. Phase 1 uses card_filters for every filter.
  return cards.filter((card) =>
    activeFilters.every((filterSlug) => card.filterSlugs.includes(filterSlug)),
  );
}

export function searchCards(
  cards: CatalogCard[],
  searchTerm: string,
): CatalogCard[] {
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase();

  if (!normalizedSearch) return cards;

  return cards.filter((card) =>
    `${card.cardName} ${card.issuer}`
      .toLocaleLowerCase()
      .includes(normalizedSearch),
  );
}
