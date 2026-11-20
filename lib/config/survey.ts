import {
  CREDIT_SCORE_OPTIONS,
  INCOME_RANGE_OPTIONS,
  type EnumeratedOption,
} from './enumerated-values';
import { SURVEY_FILTER_MAPPINGS } from '../catalog/filter-definitions';

export type Preference = 'avoid' | 'want';

export interface SurveyCategory {
  label: string;
  slug: string;
  supportsSavedSpend: boolean;
}

export interface SurveyFormValues {
  acceptsAnnualFee: boolean | null;
  categorySpend: Record<string, string>;
  creditScore: string;
  extraBenefits: string[];
  incomeRange: string;
  primaryGoal: string;
  priorityCategories: string[];
}

export interface SurveySubmission {
  accepts_annual_fee: boolean;
  card_filter_preferences: Array<{
    filter_slug: string;
    preference: Preference;
  }>;
  category_monthly_spend: Array<{
    category_slug: string;
    monthly_amount: number;
  }>;
  credit_score_band: string;
  extra_benefit_slugs: string[];
  income_range: string;
  primary_goal: string;
  priority_category_slugs: string[];
  user_filter_preferences: Array<{
    filter_slug: string;
    preference: Preference;
  }>;
  user_preferences: {
    accepts_annual_fee: boolean;
    wants_travel_rewards: boolean;
  };
}

function hasExactFields(
  value: unknown,
  fields: readonly string[],
): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return (
    (prototype === Object.prototype || prototype === null) &&
    Reflect.ownKeys(value).length === fields.length &&
    fields.every((field) => Object.hasOwn(value, field))
  );
}

function isUniqueStringArray(
  value: unknown,
  allowed: readonly string[],
  maximum = allowed.length,
): value is string[] {
  if (!Array.isArray(value) || value.length > maximum) return false;
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string' || !allowed.includes(item) || seen.has(item)) {
      return false;
    }
    seen.add(item);
  }
  return true;
}

function isFilterPreferenceArray(
  value: unknown,
): value is SurveySubmission['card_filter_preferences'] {
  if (!Array.isArray(value) || value.length > SURVEY_FILTER_SLUGS.length) {
    return false;
  }
  const seen = new Set<string>();
  for (const item of value) {
    if (
      !hasExactFields(item, ['filter_slug', 'preference']) ||
      typeof item.filter_slug !== 'string' ||
      !SURVEY_FILTER_SLUGS.includes(item.filter_slug) ||
      (item.preference !== 'want' && item.preference !== 'avoid') ||
      seen.has(item.filter_slug)
    ) {
      return false;
    }
    seen.add(item.filter_slug);
  }
  return true;
}

function isCategorySpendArray(
  value: unknown,
  priorityCategories: readonly string[],
): value is SurveySubmission['category_monthly_spend'] {
  if (!Array.isArray(value) || value.length !== priorityCategories.length) {
    return false;
  }
  const seen = new Set<string>();
  for (const item of value) {
    if (
      !hasExactFields(item, ['category_slug', 'monthly_amount']) ||
      typeof item.category_slug !== 'string' ||
      !priorityCategories.includes(item.category_slug) ||
      seen.has(item.category_slug) ||
      typeof item.monthly_amount !== 'number' ||
      !Number.isFinite(item.monthly_amount) ||
      item.monthly_amount <= 0 ||
      // user_category_spend.monthly_amount is DECIMAL(10,2).
      item.monthly_amount > 99_999_999.99
    ) {
      return false;
    }
    seen.add(item.category_slug);
  }
  return true;
}

export function isSurveySubmission(value: unknown): value is SurveySubmission {
  if (
    !hasExactFields(value, [
      'accepts_annual_fee',
      'card_filter_preferences',
      'category_monthly_spend',
      'credit_score_band',
      'extra_benefit_slugs',
      'income_range',
      'primary_goal',
      'priority_category_slugs',
      'user_filter_preferences',
      'user_preferences',
    ])
  ) {
    return false;
  }

  const preferences = value.user_preferences;
  const cardFilters = value.card_filter_preferences;
  const userFilters = value.user_filter_preferences;
  return (
    typeof value.accepts_annual_fee === 'boolean' &&
    hasOption(INCOME_RANGE_OPTIONS, value.income_range) &&
    hasOption(CREDIT_SCORE_OPTIONS, value.credit_score_band) &&
    hasOption(PRIMARY_GOAL_OPTIONS, value.primary_goal) &&
    isUniqueStringArray(
      value.priority_category_slugs,
      SURVEY_CATEGORIES.map((category) => category.slug),
      SURVEY_CONFIG.priorityCategories.maxSelections,
    ) &&
    isCategorySpendArray(
      value.category_monthly_spend,
      value.priority_category_slugs,
    ) &&
    isUniqueStringArray(
      value.extra_benefit_slugs,
      EXTRA_BENEFIT_OPTIONS.map((benefit) => benefit.value),
    ) &&
    (!value.extra_benefit_slugs.includes('none') ||
      value.extra_benefit_slugs.length === 1) &&
    isFilterPreferenceArray(cardFilters) &&
    isFilterPreferenceArray(userFilters) &&
    cardFilters.length === userFilters.length &&
    cardFilters.every((cardPreference) =>
      userFilters.some(
        (userPreference) =>
          userPreference.filter_slug === cardPreference.filter_slug &&
          userPreference.preference === cardPreference.preference,
      ),
    ) &&
    hasExactFields(preferences, [
      'accepts_annual_fee',
      'wants_travel_rewards',
    ]) &&
    preferences.accepts_annual_fee === value.accepts_annual_fee &&
    typeof preferences.wants_travel_rewards === 'boolean'
  );
}

export function surveySubmissionToFormValues(
  submission: SurveySubmission,
): SurveyFormValues {
  return {
    acceptsAnnualFee: submission.accepts_annual_fee,
    categorySpend: Object.fromEntries(
      SURVEY_CATEGORIES.map((category) => [
        category.slug,
        String(
          submission.category_monthly_spend.find(
            (item) => item.category_slug === category.slug,
          )?.monthly_amount ?? '',
        ),
      ]),
    ),
    creditScore: submission.credit_score_band,
    extraBenefits: submission.extra_benefit_slugs,
    incomeRange: submission.income_range,
    primaryGoal: submission.primary_goal,
    priorityCategories: submission.priority_category_slugs,
  };
}

export const SURVEY_CATEGORIES = [
  {
    label: 'Groceries',
    slug: 'groceries',
    supportsSavedSpend: true,
  },
  {
    label: 'Dining & food delivery',
    slug: 'dining',
    supportsSavedSpend: true,
  },
  {
    label: 'Gas',
    slug: 'gas',
    supportsSavedSpend: false,
  },
  {
    label: 'Travel',
    slug: 'travel',
    supportsSavedSpend: true,
  },
  {
    label: 'Shopping',
    slug: 'shopping',
    supportsSavedSpend: false,
  },
  {
    label: 'Transit & rideshare',
    slug: 'transit-rideshare',
    supportsSavedSpend: false,
  },
  {
    label: 'Streaming & entertainment',
    slug: 'streaming-entertainment',
    supportsSavedSpend: false,
  },
  {
    label: 'Everyday purchases',
    slug: 'everyday-purchases',
    supportsSavedSpend: false,
  },
] as const satisfies readonly SurveyCategory[];

export const PRIMARY_GOAL_OPTIONS = [
  { label: 'Cash back', value: 'cash_back' },
  { label: 'Travel rewards', value: 'travel_rewards' },
  { label: 'Building credit', value: 'building_credit' },
  { label: 'Low or no annual fee', value: 'low_or_no_annual_fee' },
  { label: 'Intro 0% APR', value: 'intro_0_apr' },
] as const satisfies readonly EnumeratedOption[];

export const EXTRA_BENEFIT_OPTIONS = [
  { label: 'No foreign transaction fee', value: 'no-foreign-transaction-fee' },
  { label: 'Airport or travel benefits', value: 'airport-travel-benefits' },
  { label: 'Purchase protection', value: 'purchase-protection' },
  { label: 'Welcome bonus', value: 'welcome-bonus' },
  { label: 'Balance-transfer offer', value: 'balance-transfer-offer' },
  { label: 'None in particular', value: 'none' },
] as const satisfies readonly EnumeratedOption[];

export const SURVEY_CONFIG = {
  annualFee: {
    description: 'This helps us avoid cards you would not consider.',
    options: [
      { label: 'Yes', value: true },
      { label: 'No', value: false },
    ],
    prompt: 'Would you consider a card with an annual fee?',
  },
  categorySpend: {
    description:
      'Enter a typical monthly amount for every category you selected.',
    prompt: 'About how much do you spend each month?',
  },
  creditScore: {
    description:
      'Choose “Building/no score yet” if you have no credit history yet.',
    options: CREDIT_SCORE_OPTIONS,
    prompt: 'What is your credit score range?',
  },
  extraBenefits: {
    description: 'Optional. Choose any benefits that matter to you.',
    exclusiveOption: 'none',
    options: EXTRA_BENEFIT_OPTIONS,
    prompt: 'Which extra benefits interest you?',
  },
  income: {
    description:
      'An estimate is enough. This is collected for future matching.',
    options: INCOME_RANGE_OPTIONS,
    prompt: 'What is your annual income?',
  },
  primaryGoal: {
    description: 'This is the main outcome you want from your next card.',
    options: PRIMARY_GOAL_OPTIONS,
    prompt: 'What do you want most from a card?',
  },
  priorityCategories: {
    description: 'Choose up to three categories that matter most to you.',
    maxSelections: 3,
    options: SURVEY_CATEGORIES,
    prompt: 'Where do you spend the most?',
  },
} as const;

export const SURVEY_FILTER_SLUGS = [
  ...new Set(Object.values(SURVEY_FILTER_MAPPINGS).flatMap(Object.values)),
];

function hasOption(
  options: readonly EnumeratedOption[],
  value: unknown,
): value is string {
  return options.some((option) => option.value === value);
}

function uniqueKnownValues(
  values: string[],
  options: readonly EnumeratedOption[] | readonly SurveyCategory[],
): string[] {
  return [
    ...new Set(
      values.filter((value) =>
        options.some((option) =>
          'slug' in option ? option.slug === value : option.value === value,
        ),
      ),
    ),
  ];
}

function filterForAnswer(
  mapping: Readonly<Record<string, string>>,
  answer: string | boolean | null,
): string | undefined {
  return mapping[String(answer)];
}

function uniqueFilterPreferences(
  preferences: SurveySubmission['card_filter_preferences'],
): SurveySubmission['card_filter_preferences'] {
  return preferences.filter(
    (preference, index) =>
      preferences.findIndex(
        (candidate) => candidate.filter_slug === preference.filter_slug,
      ) === index,
  );
}

export function deriveSurveySubmission(
  values: SurveyFormValues,
): SurveySubmission {
  const priorityCategorySlugs = uniqueKnownValues(
    values.priorityCategories,
    SURVEY_CATEGORIES,
  ).slice(0, SURVEY_CONFIG.priorityCategories.maxSelections);
  const extraBenefitSlugs = values.extraBenefits.includes(
    SURVEY_CONFIG.extraBenefits.exclusiveOption,
  )
    ? [SURVEY_CONFIG.extraBenefits.exclusiveOption]
    : uniqueKnownValues(values.extraBenefits, EXTRA_BENEFIT_OPTIONS);
  const cardFilterPreferences: SurveySubmission['card_filter_preferences'] = [];
  const annualFeeFilter = filterForAnswer(
    SURVEY_FILTER_MAPPINGS.annualFee,
    values.acceptsAnnualFee,
  );

  const creditScoreFilter = filterForAnswer(
    SURVEY_FILTER_MAPPINGS.creditScore,
    values.creditScore,
  );
  if (creditScoreFilter) {
    cardFilterPreferences.push({
      filter_slug: creditScoreFilter,
      preference: 'want',
    });
  }

  const primaryGoalFilter = filterForAnswer(
    SURVEY_FILTER_MAPPINGS.primaryGoal,
    values.primaryGoal,
  );
  if (primaryGoalFilter) {
    cardFilterPreferences.push({
      filter_slug: primaryGoalFilter,
      preference: 'want',
    });
  }

  if (annualFeeFilter) {
    cardFilterPreferences.push({
      filter_slug: annualFeeFilter,
      preference: 'want',
    });
  }

  const categoryMonthlySpend = priorityCategorySlugs.flatMap((categorySlug) => {
    const amount = Number(values.categorySpend[categorySlug]);

    if (!Number.isFinite(amount) || amount <= 0) {
      return [];
    }

    return [{ category_slug: categorySlug, monthly_amount: amount }];
  });

  const acceptsAnnualFee = values.acceptsAnnualFee === true;
  const wantsTravelRewards =
    values.primaryGoal === 'travel_rewards' ||
    extraBenefitSlugs.includes('airport-travel-benefits');

  const normalizedFilterPreferences = uniqueFilterPreferences(
    cardFilterPreferences,
  );

  return {
    accepts_annual_fee: acceptsAnnualFee,
    card_filter_preferences: normalizedFilterPreferences,
    category_monthly_spend: categoryMonthlySpend,
    credit_score_band: hasOption(CREDIT_SCORE_OPTIONS, values.creditScore)
      ? values.creditScore
      : 'unsure',
    extra_benefit_slugs: extraBenefitSlugs,
    income_range: hasOption(INCOME_RANGE_OPTIONS, values.incomeRange)
      ? values.incomeRange
      : 'under_40000',
    primary_goal: hasOption(PRIMARY_GOAL_OPTIONS, values.primaryGoal)
      ? values.primaryGoal
      : 'cash_back',
    priority_category_slugs: priorityCategorySlugs,
    user_filter_preferences: normalizedFilterPreferences,
    user_preferences: {
      accepts_annual_fee: acceptsAnnualFee,
      wants_travel_rewards: wantsTravelRewards,
    },
  };
}
