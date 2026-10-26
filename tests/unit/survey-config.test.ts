import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  CREDIT_SCORE_RANGE_VALUES,
  INCOME_RANGE_VALUES,
} from '../../lib/config/enumerated-values';
import {
  deriveSurveySubmission,
  SURVEY_CONFIG,
  SURVEY_FILTER_SLUGS,
} from '../../lib/config/survey';

const migration = readFileSync(
  'supabase/migrations/20261014120000_card_details.sql',
  'utf8',
);
const filterMigrations = [
  readFileSync(
    'supabase/migrations/20260930120000_revise_credit_card_match_schema.sql',
    'utf8',
  ),
  readFileSync(
    'supabase/migrations/20261015120000_no_annual_fee_filter.sql',
    'utf8',
  ),
];

function seededFilterSlugs(): string[] {
  return filterMigrations.flatMap((source) => {
    const values = source.match(
      /INSERT INTO public\.filters[\s\S]*?VALUES\s*([\s\S]*?);/u,
    );
    return [...(values?.[1].matchAll(/\(\s*'([^']+)'/gu) ?? [])].map(
      (match) => match[1],
    );
  });
}

function valuesFromCheckConstraint(constraintName: string): string[] {
  const constraint = migration.match(
    new RegExp(
      `ADD CONSTRAINT ${constraintName}\\s+CHECK \\(\\w+ IN \\(([^)]*)\\)\\)`,
      'su',
    ),
  );

  expect(constraint, `${constraintName} must exist`).not.toBeNull();
  return [...(constraint?.[1].matchAll(/'([^']+)'/gu) ?? [])].map(
    (match) => match[1],
  );
}

describe('deriveSurveySubmission', () => {
  it('maps score bands and primary goals while retaining future preferences', () => {
    const submission = deriveSurveySubmission({
      incomeRange: '40001_to_60000',
      creditScore: 'none',
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
      ['no-credit-history', 'cashback', 'no-annual-fee'].map((filter_slug) => ({
        filter_slug,
        preference: 'want',
      })),
    );
    expect(submission.user_preferences).toMatchObject({
      accepts_annual_fee: false,
    });
    expect(submission.credit_score_band).toBe('none');
    expect(submission.income_range).toBe('40001_to_60000');
    expect(submission.category_monthly_spend).toEqual([
      { category_slug: 'groceries', monthly_amount: 425.5 },
      { category_slug: 'travel', monthly_amount: 120 },
    ]);
    expect(submission.user_filter_preferences).toEqual([
      { filter_slug: 'no-credit-history', preference: 'want' },
      { filter_slug: 'cashback', preference: 'want' },
      { filter_slug: 'no-annual-fee', preference: 'want' },
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

  it('maps declining annual fees to the no-annual-fee filter', () => {
    const submission = deriveSurveySubmission({
      acceptsAnnualFee: false,
      categorySpend: {},
      creditScore: 'good',
      extraBenefits: [],
      incomeRange: '60001_to_80000',
      primaryGoal: 'travel_rewards',
      priorityCategories: [],
    });

    expect(submission.card_filter_preferences).toContainEqual({
      filter_slug: 'no-annual-fee',
      preference: 'want',
    });
  });

  it('stores an unknown score as unsure without treating it as no history', () => {
    const submission = deriveSurveySubmission({
      acceptsAnnualFee: true,
      categorySpend: {},
      creditScore: 'unsure',
      extraBenefits: [],
      incomeRange: 'over_100000',
      primaryGoal: 'travel_rewards',
      priorityCategories: [],
    });

    expect(submission.credit_score_band).toBe('unsure');
    expect(submission.card_filter_preferences).not.toContainEqual({
      filter_slug: 'no-credit-history',
      preference: 'want',
    });
  });
});

describe('survey database enum compatibility', () => {
  it('derives only filter slugs present in the seeded catalog', () => {
    const filters = new Set(seededFilterSlugs());

    for (const slug of SURVEY_FILTER_SLUGS) {
      expect(filters).toContain(slug);
    }
  });

  it('keeps every credit-score and income option within its database CHECK list', () => {
    const creditScoreCheckValues = valuesFromCheckConstraint(
      'user_preferences_credit_score_range_check',
    );
    const incomeCheckValues = valuesFromCheckConstraint(
      'user_preferences_income_range_check',
    );

    expect(creditScoreCheckValues).toEqual([...CREDIT_SCORE_RANGE_VALUES]);
    expect(incomeCheckValues).toEqual([...INCOME_RANGE_VALUES]);

    for (const option of SURVEY_CONFIG.creditScore.options) {
      expect(creditScoreCheckValues).toContain(option.value);
    }
    for (const option of SURVEY_CONFIG.income.options) {
      expect(incomeCheckValues).toContain(option.value);
    }
  });
});
