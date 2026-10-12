import type { SurveySubmission } from '../config/survey';

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

function looksLikeSurveySubmission(value: unknown): value is SurveySubmission {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<SurveySubmission>;
  return (
    typeof candidate.accepts_annual_fee === 'boolean' &&
    Array.isArray(candidate.card_filter_preferences) &&
    Array.isArray(candidate.category_monthly_spend) &&
    typeof candidate.credit_score_band === 'string' &&
    Array.isArray(candidate.extra_benefit_slugs) &&
    typeof candidate.income_range === 'string' &&
    typeof candidate.primary_goal === 'string' &&
    Array.isArray(candidate.priority_category_slugs) &&
    Boolean(candidate.user_preferences) &&
    Array.isArray(candidate.user_filter_preferences)
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
