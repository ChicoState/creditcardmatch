import { describe, expect, it } from 'vitest';

import {
  deriveSurveySubmission,
  isSurveySubmission,
  SURVEY_FILTER_SLUGS,
} from '../../lib/config/survey';

function validSubmission() {
  return deriveSurveySubmission({
    acceptsAnnualFee: false,
    categorySpend: { groceries: '250.50', dining: '100' },
    creditScore: 'good',
    extraBenefits: ['purchase-protection'],
    incomeRange: '40001_to_60000',
    primaryGoal: 'cash_back',
    priorityCategories: ['groceries', 'dining'],
  });
}

const invalidPayloads: Array<[string, unknown]> = [
  ['null payload', null],
  ['primitive payload', 'survey'],
  [
    'array payload with survey properties',
    Object.assign([], validSubmission()),
  ],
  ['unexpected snapshot field', { ...validSubmission(), extra: 'unvalidated' }],
  ['missing income', { ...validSubmission(), income_range: undefined }],
  ['unknown income', { ...validSubmission(), income_range: 'unlimited' }],
  ['unknown score', { ...validSubmission(), credit_score_band: 'perfect' }],
  ['unknown goal', { ...validSubmission(), primary_goal: 'unknown' }],
  ['null preferences', { ...validSubmission(), user_preferences: null }],
  ['array preferences', { ...validSubmission(), user_preferences: [] }],
  [
    'null spending row',
    { ...validSubmission(), category_monthly_spend: [null, null] },
  ],
  [
    'null card filter',
    { ...validSubmission(), card_filter_preferences: [null] },
  ],
  [
    'null user filter',
    { ...validSubmission(), user_filter_preferences: [null] },
  ],
  [
    'sparse spending rows',
    { ...validSubmission(), category_monthly_spend: new Array(2) },
  ],
  [
    'sparse filters',
    { ...validSubmission(), user_filter_preferences: new Array(1) },
  ],
  [
    'unknown category',
    { ...validSubmission(), priority_category_slugs: ['unknown'] },
  ],
  [
    'duplicate categories',
    {
      ...validSubmission(),
      priority_category_slugs: ['groceries', 'groceries'],
    },
  ],
  [
    'too many categories',
    {
      ...validSubmission(),
      priority_category_slugs: ['groceries', 'dining', 'gas', 'travel'],
    },
  ],
  [
    'sparse categories',
    { ...validSubmission(), priority_category_slugs: new Array(2) },
  ],
  [
    'missing selected-category spending',
    { ...validSubmission(), category_monthly_spend: [] },
  ],
  [
    'duplicate spending',
    {
      ...validSubmission(),
      category_monthly_spend: [
        validSubmission().category_monthly_spend[0],
        validSubmission().category_monthly_spend[0],
      ],
    },
  ],
  [
    'spending for an unselected category',
    {
      ...validSubmission(),
      category_monthly_spend: [
        { category_slug: 'gas', monthly_amount: 20 },
        validSubmission().category_monthly_spend[1],
      ],
    },
  ],
  [
    'unknown benefit',
    { ...validSubmission(), extra_benefit_slugs: ['unknown'] },
  ],
  [
    'duplicate benefits',
    {
      ...validSubmission(),
      extra_benefit_slugs: ['welcome-bonus', 'welcome-bonus'],
    },
  ],
  [
    'exclusive benefit combined with another',
    { ...validSubmission(), extra_benefit_slugs: ['none', 'welcome-bonus'] },
  ],
  [
    'oversized benefit array',
    {
      ...validSubmission(),
      extra_benefit_slugs: Array(100).fill('welcome-bonus'),
    },
  ],
  [
    'duplicate filters',
    {
      ...validSubmission(),
      user_filter_preferences: [
        validSubmission().user_filter_preferences[0],
        validSubmission().user_filter_preferences[0],
      ],
    },
  ],
  [
    'oversized filters',
    {
      ...validSubmission(),
      user_filter_preferences: Array(SURVEY_FILTER_SLUGS.length + 1).fill(
        validSubmission().user_filter_preferences[0],
      ),
    },
  ],
  [
    'unknown filter',
    {
      ...validSubmission(),
      user_filter_preferences: [{ filter_slug: 'unknown', preference: 'want' }],
    },
  ],
  [
    'unknown preference',
    {
      ...validSubmission(),
      user_filter_preferences: [
        { filter_slug: 'cashback', preference: 'sometimes' },
      ],
    },
  ],
  [
    'conflicting filter copies',
    {
      ...validSubmission(),
      user_filter_preferences: [
        { filter_slug: 'cashback', preference: 'avoid' },
        validSubmission().user_filter_preferences[1],
      ],
    },
  ],
  [
    'conflicting annual-fee flags',
    {
      ...validSubmission(),
      user_preferences: {
        accepts_annual_fee: true,
        wants_travel_rewards: false,
      },
    },
  ],
  [
    'non-boolean travel flag',
    {
      ...validSubmission(),
      user_preferences: {
        accepts_annual_fee: false,
        wants_travel_rewards: 'yes',
      },
    },
  ],
];

for (const field of [
  'card_filter_preferences',
  'user_filter_preferences',
  'category_monthly_spend',
  'priority_category_slugs',
  'extra_benefit_slugs',
] as const) {
  invalidPayloads.push([
    `${field} must be an array`,
    { ...validSubmission(), [field]: {} },
  ]);
}
for (const field of [
  'card_filter_preferences',
  'user_filter_preferences',
  'category_monthly_spend',
] as const) {
  invalidPayloads.push([
    `unexpected field in ${field}`,
    {
      ...validSubmission(),
      [field]: validSubmission()[field].map((row) => ({ ...row, extra: true })),
    },
  ]);
}
invalidPayloads.push([
  'unexpected user preference field',
  {
    ...validSubmission(),
    user_preferences: { ...validSubmission().user_preferences, extra: true },
  },
]);
for (const amount of [NaN, Infinity, -Infinity, 0, -1, 100_000_000, '250']) {
  invalidPayloads.push([
    `invalid monthly amount ${String(amount)}`,
    {
      ...validSubmission(),
      category_monthly_spend: [
        { category_slug: 'groceries', monthly_amount: amount },
        validSubmission().category_monthly_spend[1],
      ],
    },
  ]);
}

describe('isSurveySubmission runtime boundary', () => {
  it.each(invalidPayloads)('rejects %s without throwing', (_label, payload) => {
    expect(isSurveySubmission(payload)).toBe(false);
  });

  it('accepts a complete submission and the largest database-safe amount', () => {
    const submission = validSubmission();
    submission.category_monthly_spend[0].monthly_amount = 99_999_999.99;
    expect(isSurveySubmission(submission)).toBe(true);
  });

  it('preserves optional empty selections', () => {
    const submission = deriveSurveySubmission({
      acceptsAnnualFee: true,
      categorySpend: {},
      creditScore: 'unsure',
      extraBenefits: [],
      incomeRange: 'over_100000',
      primaryGoal: 'travel_rewards',
      priorityCategories: [],
    });
    expect(isSurveySubmission(submission)).toBe(true);
  });

  it('accepts equivalent filter copies regardless of ordering and permits avoid', () => {
    const submission = validSubmission();
    submission.card_filter_preferences = [
      { filter_slug: 'cashback', preference: 'avoid' },
      { filter_slug: 'no-annual-fee', preference: 'want' },
    ];
    submission.user_filter_preferences = [
      ...submission.card_filter_preferences,
    ].reverse();
    expect(isSurveySubmission(submission)).toBe(true);
  });
});
