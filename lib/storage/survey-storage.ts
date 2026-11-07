import {
  CREDIT_SCORE_OPTIONS,
  INCOME_RANGE_OPTIONS,
} from '../config/enumerated-values';
import {
  EXTRA_BENEFIT_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  SURVEY_CATEGORIES,
  SURVEY_FILTER_SLUGS,
  type SurveySubmission,
} from '../config/survey';

export const SURVEY_STORAGE_KEY = 'ccm:survey:v2';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): unknown;
  removeItem(key: string): unknown;
}

function browserStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function isKnownValue(
  value: unknown,
  options: readonly { value: string }[],
): value is string {
  return (
    typeof value === 'string' &&
    options.some((option) => option.value === value)
  );
}

function isUniqueStringArray(
  value: unknown,
  allowedValues: ReadonlySet<string>,
  maximum: number,
): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= maximum &&
    value.every(
      (item): item is string =>
        typeof item === 'string' && allowedValues.has(item),
    ) &&
    new Set(value).size === value.length
  );
}

function isFilterPreferenceArray(value: unknown): boolean {
  if (!Array.isArray(value) || value.length > SURVEY_FILTER_SLUGS.length) {
    return false;
  }

  const knownFilters = new Set(SURVEY_FILTER_SLUGS);
  return (
    value.every(
      (item): item is { filter_slug: string; preference: 'avoid' | 'want' } =>
        Boolean(item) &&
        typeof item === 'object' &&
        'filter_slug' in item &&
        'preference' in item &&
        typeof item.filter_slug === 'string' &&
        knownFilters.has(item.filter_slug) &&
        (item.preference === 'avoid' || item.preference === 'want'),
    ) && new Set(value.map((item) => item.filter_slug)).size === value.length
  );
}

function isCategorySpendArray(
  value: unknown,
  priorityCategorySlugs: readonly string[],
): value is SurveySubmission['category_monthly_spend'] {
  if (!Array.isArray(value) || value.length !== priorityCategorySlugs.length) {
    return false;
  }

  const priorityCategories = new Set(priorityCategorySlugs);
  return (
    value.every(
      (item): item is { category_slug: string; monthly_amount: number } =>
        Boolean(item) &&
        typeof item === 'object' &&
        'category_slug' in item &&
        'monthly_amount' in item &&
        typeof item.category_slug === 'string' &&
        priorityCategories.has(item.category_slug) &&
        typeof item.monthly_amount === 'number' &&
        Number.isFinite(item.monthly_amount) &&
        item.monthly_amount > 0,
    ) && new Set(value.map((item) => item.category_slug)).size === value.length
  );
}

function looksLikeSurveySubmission(value: unknown): value is SurveySubmission {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<SurveySubmission>;
  const priorityCategorySlugs = new Set(
    SURVEY_CATEGORIES.map((category) => category.slug),
  );
  const benefitSlugs = new Set(
    EXTRA_BENEFIT_OPTIONS.map((benefit) => benefit.value),
  );
  const userPreferences = candidate.user_preferences;

  if (!userPreferences || typeof userPreferences !== 'object') return false;

  return (
    typeof candidate.accepts_annual_fee === 'boolean' &&
    isFilterPreferenceArray(candidate.card_filter_preferences) &&
    isKnownValue(candidate.credit_score_band, CREDIT_SCORE_OPTIONS) &&
    isKnownValue(candidate.income_range, INCOME_RANGE_OPTIONS) &&
    isKnownValue(candidate.primary_goal, PRIMARY_GOAL_OPTIONS) &&
    isUniqueStringArray(
      candidate.priority_category_slugs,
      priorityCategorySlugs,
      3,
    ) &&
    isCategorySpendArray(
      candidate.category_monthly_spend,
      candidate.priority_category_slugs,
    ) &&
    isUniqueStringArray(candidate.extra_benefit_slugs, benefitSlugs, 6) &&
    (candidate.extra_benefit_slugs.includes('none')
      ? candidate.extra_benefit_slugs.length === 1
      : true) &&
    isFilterPreferenceArray(candidate.user_filter_preferences) &&
    JSON.stringify(candidate.user_filter_preferences) ===
      JSON.stringify(candidate.card_filter_preferences) &&
    typeof userPreferences.accepts_annual_fee === 'boolean' &&
    userPreferences.accepts_annual_fee === candidate.accepts_annual_fee &&
    typeof userPreferences.wants_travel_rewards === 'boolean'
  );
}

export function saveSurveyAnswers(
  submission: SurveySubmission,
  storage: StorageLike | null = browserStorage(),
): boolean {
  if (!storage) return false;

  try {
    storage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(submission));
    return true;
  } catch {
    return false;
  }
}

export function loadSurveyAnswers(
  storage: StorageLike | null = browserStorage(),
): SurveySubmission | null {
  if (!storage) return null;

  try {
    const storedValue = storage.getItem(SURVEY_STORAGE_KEY);
    if (!storedValue) return null;

    const parsedValue: unknown = JSON.parse(storedValue);
    return looksLikeSurveySubmission(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

export function clearSurveyAnswers(
  storage: StorageLike | null = browserStorage(),
): boolean {
  if (!storage) return false;

  try {
    storage.removeItem(SURVEY_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
