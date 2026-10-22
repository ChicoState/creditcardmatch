import { describe, expect, it } from 'vitest';

import { filterCards, searchCards } from '../../lib/catalog/filter-cards';
import { getCardMatchRating, rankCards } from '../../lib/catalog/rank-cards';
import type { SurveySubmission } from '../../lib/config/survey';
import { selectVisibleCatalogCards } from '../../lib/catalog/visibility';
import { catalogFixture } from '../fixtures/catalog';

describe('catalog selection', () => {
  it('hides inactive cards, keeps the verification flag, and orders benefits', () => {
    const cards = selectVisibleCatalogCards(catalogFixture);

    expect(cards.map((card) => card.cardName)).toEqual([
      'Harbor Starter Card',
      'Aurora Everyday Card',
    ]);
    expect(cards[0]).toMatchObject({
      isVerified: false,
      annualFeeWaivedFirstYear: true,
      oneTimeFee: 25,
      monthlyFee: 5,
      isSecured: true,
      securityDepositMin: 49,
      rewardCategories: [
        {
          categorySlug: 'groceries',
          categoryLabel: 'Groceries',
          rewardRate: 2,
          spendCap: null,
          capPeriod: null,
          rateAfterCap: null,
        },
      ],
      benefits: ['First benefit', 'Second benefit'],
    });
  });
});

describe('filterCards', () => {
  it('requires every active filter to match', () => {
    const cards = selectVisibleCatalogCards(catalogFixture);

    expect(
      filterCards(cards, ['cashback', 'no-credit-history']).map(
        (card) => card.cardName,
      ),
    ).toEqual(['Harbor Starter Card']);
  });

  it('returns every card when no filter is active', () => {
    const cards = selectVisibleCatalogCards(catalogFixture);

    expect(filterCards(cards, [])).toHaveLength(2);
  });
});

describe('searchCards', () => {
  it('searches card names and issuers without case sensitivity', () => {
    const cards = selectVisibleCatalogCards(catalogFixture);

    expect(searchCards(cards, 'AURORA')).toHaveLength(1);
    expect(searchCards(cards, 'harbor bank')).toHaveLength(1);
    expect(searchCards(cards, 'missing')).toEqual([]);
  });
});

describe('rankCards', () => {
  it('orders cards by survey fit before using card name as a tie breaker', () => {
    const cards = selectVisibleCatalogCards(catalogFixture);
    const surveyAnswers: SurveySubmission = {
      accepts_annual_fee: false,
      card_filter_preferences: [],
      category_monthly_spend: [],
      credit_score_band: 'good',
      extra_benefit_slugs: [],
      income_range: '60001_to_80000',
      primary_goal: 'cash_back',
      priority_category_slugs: [],
      user_filter_preferences: [],
      user_preferences: {
        accepts_annual_fee: false,
        wants_travel_rewards: false,
      },
    };

    expect(
      rankCards(cards, {
        activeFilters: [],
        surveyAnswers,
      }).map((card) => card.cardName),
    ).toEqual(['Aurora Everyday Card', 'Harbor Starter Card']);
  });

  it('classifies cards with neutral labels instead of a rejection label', () => {
    const cards = selectVisibleCatalogCards(catalogFixture);
    const surveyAnswers: SurveySubmission = {
      accepts_annual_fee: false,
      card_filter_preferences: [],
      category_monthly_spend: [],
      credit_score_band: 'none',
      extra_benefit_slugs: [],
      income_range: 'under_40000',
      primary_goal: 'building_credit',
      priority_category_slugs: [],
      user_filter_preferences: [],
      user_preferences: {
        accepts_annual_fee: false,
        wants_travel_rewards: false,
      },
    };

    expect(
      getCardMatchRating(cards[0], { activeFilters: [], surveyAnswers }),
    ).toBe('Best match');
    expect(
      getCardMatchRating(cards[1], { activeFilters: [], surveyAnswers }),
    ).toBeNull();
    expect(
      getCardMatchRating(cards[0], { activeFilters: [], surveyAnswers: null }),
    ).toBeNull();
  });

  it('weights category overlap and spending above other preferences', () => {
    const cards = selectVisibleCatalogCards(catalogFixture);
    const surveyAnswers: SurveySubmission = {
      accepts_annual_fee: false,
      card_filter_preferences: [],
      category_monthly_spend: [
        { category_slug: 'groceries', monthly_amount: 500 },
      ],
      credit_score_band: 'good',
      extra_benefit_slugs: [],
      income_range: '60001_to_80000',
      primary_goal: 'cash_back',
      priority_category_slugs: ['groceries'],
      user_filter_preferences: [],
      user_preferences: {
        accepts_annual_fee: false,
        wants_travel_rewards: false,
      },
    };

    expect(
      rankCards(cards, { activeFilters: [], surveyAnswers })[0].cardName,
    ).toBe('Aurora Everyday Card');
    expect(
      getCardMatchRating(cards[1], { activeFilters: [], surveyAnswers }),
    ).toBe('Best match');
  });
});
