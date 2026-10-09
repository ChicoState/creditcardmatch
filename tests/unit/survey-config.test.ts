import { describe, expect, it } from 'vitest';

import { deriveSurveySubmission } from '../../lib/config/survey';

describe('deriveSurveySubmission', () => {
  it('maps configured answers to filters and database-shaped saved fields', () => {
    const submission = deriveSurveySubmission({
      incomeRange: 'income_placeholder_mid',
      creditHistory: 'no_history',
      categorySpend: {
        groceries: '425.50',
        dining: '',
      },
      desiredFeatures: ['cashback'],
      unwantedFeatures: ['popular-cards'],
    });

    expect(submission.derived_filter_slugs).toEqual([
      'new-to-credit',
      'cashback',
    ]);
    expect(submission.user_preferences).toMatchObject({
      income_range: 'income_placeholder_mid',
      credit_score_range: 'no_history',
    });
    expect(submission.user_category_spend).toEqual([
      { category_slug: 'groceries', monthly_amount: 425.5 },
    ]);
    expect(submission.user_filter_preferences).toEqual([
      { filter_slug: 'cashback', preference: 'want' },
      { filter_slug: 'popular-cards', preference: 'avoid' },
    ]);
  });
});
