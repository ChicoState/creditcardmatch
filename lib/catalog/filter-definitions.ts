export const SURVEY_FILTER_MAPPINGS = {
  annualFee: { false: 'no-annual-fee' },
  creditScore: { none: 'no-credit-history' },
  primaryGoal: {
    building_credit: 'no-credit-history',
    cash_back: 'cashback',
  },
} as const;

const SURVEY_CATEGORY_CATALOG_SLUGS: Readonly<
  Record<string, readonly string[]>
> = {
  groceries: ['groceries'],
  dining: ['dining'],
  gas: ['gas'],
  travel: ['travel'],
  shopping: ['online_shopping'],
  'transit-rideshare': [],
  'streaming-entertainment': ['streaming'],
  'everyday-purchases': ['other'],
};

export function getCatalogCategorySlugs(
  surveyCategorySlug: string,
): readonly string[] {
  return SURVEY_CATEGORY_CATALOG_SLUGS[surveyCategorySlug] ?? [];
}
