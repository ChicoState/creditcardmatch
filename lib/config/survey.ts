import {
  CREDIT_SCORE_RANGE_OPTIONS,
  INCOME_RANGE_OPTIONS,
  type EnumeratedOption,
} from './enumerated-values';

type Preference = 'want' | 'avoid';

interface FilterPreferenceOption extends EnumeratedOption {
  filterSlug: string;
  preference: Preference;
}

interface CreditHistoryOption extends EnumeratedOption {
  filterSlug?: string;
}

export interface SurveyFormValues {
  incomeRange: string;
  creditHistory: string;
  categorySpend: Record<string, string>;
  desiredFeatures: string[];
  unwantedFeatures: string[];
}

export interface SurveySubmission {
  derived_filter_slugs: string[];
  user_preferences: {
    credit_score_range: string | null;
    monthly_spend: number | null;
    accepts_annual_fee: boolean | null;
    wants_travel_rewards: boolean | null;
    income_range: string | null;
  };
  user_category_spend: Array<{
    category_slug: string;
    monthly_amount: number;
  }>;
  user_filter_preferences: Array<{
    filter_slug: string;
    preference: Preference;
  }>;
}

const creditHistoryOptions: CreditHistoryOption[] =
  CREDIT_SCORE_RANGE_OPTIONS.map((option) =>
    option.value === 'no_history'
      ? { ...option, filterSlug: 'new-to-credit' }
      : option,
  );

// TODO(TBD): Confirm all survey wording, explanations, options, and category set.
export const SURVEY_CONFIG = {
  income: {
    question: 'What is your income range? (Placeholder wording)',
    explanation:
      'This placeholder answer may help narrow eligibility later. Exact ranges are TBD.',
    savedField: 'income_range' as const,
    options: INCOME_RANGE_OPTIONS,
  },
  creditHistory: {
    question:
      'How would you describe your credit history? (Placeholder wording)',
    explanation:
      'This placeholder answer helps identify cards intended for newer or established credit profiles.',
    savedField: 'credit_score_range' as const,
    options: creditHistoryOptions,
  },
  categorySpend: {
    question: 'Where do you spend most each month? (Placeholder categories)',
    explanation:
      'Enter optional monthly estimates. Categories and wording are still TBD.',
    savedCollection: 'user_category_spend' as const,
    categories: [
      { slug: 'groceries', label: 'Groceries (TBD)' },
      { slug: 'dining', label: 'Dining (TBD)' },
      { slug: 'travel', label: 'Travel (TBD)' },
    ],
  },
  desiredFeatures: {
    question: 'Which features do you want? (Placeholder wording)',
    explanation:
      'Wanted features become active recommendation filters and saved preferences.',
    options: [
      {
        value: 'popular-cards',
        label: 'Popular Cards',
        filterSlug: 'popular-cards',
        preference: 'want',
      },
      {
        value: 'cashback',
        label: 'Cashback',
        filterSlug: 'cashback',
        preference: 'want',
      },
    ] satisfies FilterPreferenceOption[],
  },
  unwantedFeatures: {
    question: 'Which features do you want to avoid? (Placeholder wording)',
    explanation:
      'Avoided features are saved for future ranking behavior but are not positive result filters.',
    options: [
      {
        value: 'popular-cards',
        label: 'Cards tagged Popular Cards (TBD)',
        filterSlug: 'popular-cards',
        preference: 'avoid',
      },
      {
        value: 'cashback',
        label: 'Cards tagged Cashback (TBD)',
        filterSlug: 'cashback',
        preference: 'avoid',
      },
    ] satisfies FilterPreferenceOption[],
  },
} as const;

export function deriveSurveySubmission(
  values: SurveyFormValues,
): SurveySubmission {
  const creditAnswer = SURVEY_CONFIG.creditHistory.options.find(
    (option) => option.value === values.creditHistory,
  );
  const incomeAnswer = SURVEY_CONFIG.income.options.find(
    (option) => option.value === values.incomeRange,
  );
  const desiredAnswers = SURVEY_CONFIG.desiredFeatures.options.filter(
    (option) => values.desiredFeatures.includes(option.value),
  );
  const unwantedAnswers = SURVEY_CONFIG.unwantedFeatures.options.filter(
    (option) => values.unwantedFeatures.includes(option.value),
  );
  const derivedFilterSlugs = [
    creditAnswer?.filterSlug,
    ...desiredAnswers.map((option) => option.filterSlug),
  ].filter((slug): slug is string => Boolean(slug));

  return {
    derived_filter_slugs: [...new Set(derivedFilterSlugs)],
    user_preferences: {
      income_range: incomeAnswer?.value ?? null,
      credit_score_range: creditAnswer?.value ?? null,
      // TODO(TBD): Decide whether these fields remain and how survey answers map to them.
      monthly_spend: null,
      accepts_annual_fee: null,
      wants_travel_rewards: null,
    },
    user_category_spend: SURVEY_CONFIG.categorySpend.categories.flatMap(
      (category) => {
        const monthlyAmount = Number(values.categorySpend[category.slug]);
        return Number.isFinite(monthlyAmount) && monthlyAmount > 0
          ? [
              {
                category_slug: category.slug,
                monthly_amount: monthlyAmount,
              },
            ]
          : [];
      },
    ),
    user_filter_preferences: [...desiredAnswers, ...unwantedAnswers].map(
      (option) => ({
        filter_slug: option.filterSlug,
        preference: option.preference,
      }),
    ),
  };
}
