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

const CONFIRMED_BENEFIT_EVIDENCE: Readonly<Record<string, readonly RegExp[]>> =
  {
    'no-foreign-transaction-fee': [/no foreign transaction fee/i],
    'airport-travel-benefits': [
      /airline and hotel partners/i,
      /global entry|tsa precheck/i,
      /hotel credit via .* travel/i,
      /trip cancellation\/interruption insurance/i,
      /transfer (?:points|miles) to .* travel programs/i,
    ],
    'purchase-protection': [/purchase protection/i],
    'welcome-bonus': [],
    'balance-transfer-offer': [],
  };

export function getCatalogCategorySlugs(
  surveyCategorySlug: string,
): readonly string[] {
  return SURVEY_CATEGORY_CATALOG_SLUGS[surveyCategorySlug] ?? [];
}

export function getConfirmedBenefitSlugs(
  benefitDescriptions: readonly string[],
): string[] {
  return Object.entries(CONFIRMED_BENEFIT_EVIDENCE)
    .filter(([, evidence]) =>
      evidence.some((pattern) =>
        benefitDescriptions.some((description) => pattern.test(description)),
      ),
    )
    .map(([benefitSlug]) => benefitSlug);
}
