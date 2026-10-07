import { describe, expect, it } from 'vitest';

import type { SurveySubmission } from '../../lib/config/survey';
import {
  clearSurveyAnswers,
  loadSurveyAnswers,
  saveSurveyAnswers,
  SURVEY_STORAGE_KEY,
} from '../../lib/storage/survey-storage';

const submission: SurveySubmission = {
  derived_filter_slugs: ['cashback'],
  user_preferences: {
    income_range: null,
    credit_score_range: null,
    monthly_spend: null,
    accepts_annual_fee: null,
    wants_travel_rewards: null,
  },
  user_category_spend: [],
  user_filter_preferences: [],
};

describe('survey storage', () => {
  it('round-trips survey answers with a versioned key', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };

    expect(saveSurveyAnswers(submission, storage)).toBe(true);
    expect(values.has(SURVEY_STORAGE_KEY)).toBe(true);
    expect(loadSurveyAnswers(storage)).toEqual(submission);
    expect(clearSurveyAnswers(storage)).toBe(true);
    expect(loadSurveyAnswers(storage)).toBeNull();
  });

  it('keeps the app working when storage throws', () => {
    const storage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };

    expect(saveSurveyAnswers(submission, storage)).toBe(false);
    expect(loadSurveyAnswers(storage)).toBeNull();
    expect(clearSurveyAnswers(storage)).toBe(false);
  });
});
