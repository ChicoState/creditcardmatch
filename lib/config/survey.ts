import {
  CREDIT_SCORE_OPTIONS,
  INCOME_RANGE_OPTIONS,
  type EnumeratedOption,
} from './enumerated-values';

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

export const SURVEY_CATEGORIES = [
  { label: 'Groceries', slug: 'groceries', supportsSavedSpend: true },
  { label: 'Dining & food delivery', slug: 'dining', supportsSavedSpend: true },
  { label: 'Gas', slug: 'gas', supportsSavedSpend: false },
  { label: 'Travel', slug: 'travel', supportsSavedSpend: true },
  { label: 'Shopping', slug: 'shopping', supportsSavedSpend: false },
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
    description: 'Optional. Enter a typical monthly amount for any category.',
    prompt: 'About how much do you spend each month?',
  },
  creditScore: {
    description: 'Choose “Building/no score yet” if you are new to credit.',
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

function hasOption(
  options: readonly EnumeratedOption[],
  value: string,
): boolean {
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

  if (values.creditScore === 'no_history') {
    cardFilterPreferences.push({
      filter_slug: 'new-to-credit',
      preference: 'want',
    });
  }

  if (values.primaryGoal === 'cash_back') {
    cardFilterPreferences.push({ filter_slug: 'cashback', preference: 'want' });
  }

  if (values.primaryGoal === 'building_credit') {
    cardFilterPreferences.push({
      filter_slug: 'new-to-credit',
      preference: 'want',
    });
  }

  const categoryMonthlySpend = priorityCategorySlugs.flatMap((categorySlug) => {
    const category = SURVEY_CATEGORIES.find(
      (option) => option.slug === categorySlug,
    );
    const amount = Number(values.categorySpend[categorySlug]);

    if (
      !category?.supportsSavedSpend ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return [];
    }

    return [{ category_slug: categorySlug, monthly_amount: amount }];
  });

  const acceptsAnnualFee = values.acceptsAnnualFee === true;
  const wantsTravelRewards =
    values.primaryGoal === 'travel_rewards' ||
    extraBenefitSlugs.includes('airport-travel-benefits');

  return {
    accepts_annual_fee: acceptsAnnualFee,
    card_filter_preferences: cardFilterPreferences,
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
    user_filter_preferences: cardFilterPreferences,
    user_preferences: {
      accepts_annual_fee: acceptsAnnualFee,
      wants_travel_rewards: wantsTravelRewards,
    },
  };
}
