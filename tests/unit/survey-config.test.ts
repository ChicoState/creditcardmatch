import { describe, expect, it } from 'vitest';

import { deriveSurveySubmission } from '../../lib/config/survey';

describe('deriveSurveySubmission', () => {
  it('maps score bands and primary goals while retaining future preferences', () => {
    const submission = deriveSurveySubmission({
      incomeRange: '40001_to_60000',
      creditScore: 'no_history',
      primaryGoal: 'cash_back',
      priorityCategories: ['groceries', 'gas', 'travel'],
      categorySpend: {
        groceries: '425.50',
        gas: '95',
        travel: '120',
      },
      acceptsAnnualFee: false,
      extraBenefits: ['purchase-protection', 'welcome-bonus'],
    });

    expect(submission.card_filter_preferences).toEqual(
      ['new-to-credit', 'cashback'].map((filter_slug) => ({
        filter_slug,
        preference: 'want',
      })),
    );
    expect(submission.user_preferences).toMatchObject({
      accepts_annual_fee: false,
    });
    expect(submission.category_monthly_spend).toEqual([
      { category_slug: 'groceries', monthly_amount: 425.5 },
      { category_slug: 'travel', monthly_amount: 120 },
    ]);
    expect(submission.user_filter_preferences).toEqual([
      { filter_slug: 'new-to-credit', preference: 'want' },
      { filter_slug: 'cashback', preference: 'want' },
    ]);
    expect(submission.primary_goal).toBe('cash_back');
    expect(submission.priority_category_slugs).toEqual([
      'groceries',
      'gas',
      'travel',
    ]);
    expect(submission.extra_benefit_slugs).toEqual([
      'purchase-protection',
      'welcome-bonus',
    ]);
  });
});
