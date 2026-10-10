import { describe, expect, it } from 'vitest';

import type { SurveySubmission } from '../../lib/config/survey';
import {
  clearSurveyAnswers,
  loadSurveyAnswers,
  saveSurveyAnswers,
  SURVEY_STORAGE_KEY,
} from '../../lib/storage/survey-storage';

const submission: SurveySubmission = {
  accepts_annual_fee: false,
  card_filter_preferences: [{ filter_slug: 'cashback', preference: 'want' }],
  category_monthly_spend: [],
  credit_score_band: 'good',
  extra_benefit_slugs: [],
  income_range: '40001_to_60000',
  primary_goal: 'cash_back',
  priority_category_slugs: ['groceries'],
  user_preferences: {
    accepts_annual_fee: false,
    wants_travel_rewards: false,
  },
  user_filter_preferences: [{ filter_slug: 'cashback', preference: 'want' }],
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
