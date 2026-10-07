import type { SurveySubmission } from '../config/survey';

export const SURVEY_STORAGE_KEY = 'ccm:survey:v1';

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
    Array.isArray(candidate.derived_filter_slugs) &&
    Boolean(candidate.user_preferences) &&
    Array.isArray(candidate.user_category_spend) &&
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
