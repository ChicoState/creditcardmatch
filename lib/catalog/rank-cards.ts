import type { SurveySubmission } from '../config/survey';
import type { CardRewardCategory, CatalogCard, CreditLevel } from './types';

export interface RankingContext {
  activeFilters: string[];
  surveyAnswers: SurveySubmission | null;
}

export type CardMatchRating = 'Best match' | 'Okay' | null;

export interface CardMatch {
  rating: CardMatchRating;
  score: number;
  maximumScore: number;
  hasCategoryOverlap: boolean;
  reasons: string[];
}

const CREDIT_LEVEL_SCORE: Record<CreditLevel, number> = {
  none: 0,
  fair: 1,
  good: 2,
  excellent: 3,
};

const BEST_MATCH_THRESHOLD = 75;
const OKAY_THRESHOLD = 40;
const CATEGORY_WEIGHT = 40;
const SPENDING_WEIGHT = 35;
const CREDIT_WEIGHT = 15;
const PREFERENCE_WEIGHT = 10;

interface Criterion {
  maximumScore: number;
  reason: string;
  score: number;
}

function rewardValueRate(
  card: CatalogCard,
  reward: CardRewardCategory,
): number {
  if (card.rewardType === 'cashback') return reward.rewardRate;
  if (card.pointValueCents !== null) {
    return reward.rewardRate * card.pointValueCents;
  }
  return 0;
}

function cappedMonthlyValue(
  card: CatalogCard,
  reward: CardRewardCategory,
  monthlySpend: number,
): number {
  const spendAtBaseRate =
    reward.spendCap !== null && reward.capPeriod === 'month'
      ? Math.min(monthlySpend, reward.spendCap)
      : monthlySpend;
  const spendAfterCap = monthlySpend - spendAtBaseRate;
  const afterCapRate = reward.rateAfterCap ?? reward.rewardRate;

  return (
    spendAtBaseRate * rewardValueRate(card, reward) +
    (spendAfterCap > 0 && reward.spendCap !== null
      ? spendAfterCap *
        (card.rewardType === 'cashback'
          ? afterCapRate
          : (card.pointValueCents ?? 0) * afterCapRate)
      : 0)
  );
}

function categoryCriteria(
  card: CatalogCard,
  surveyAnswers: SurveySubmission,
): { criteria: Criterion[]; hasCategoryOverlap: boolean } {
  const spendingByCategory = new Map(
    surveyAnswers.category_monthly_spend.map((item) => [
      item.category_slug,
      item.monthly_amount,
    ]),
  );
  const selectedCategories = surveyAnswers.priority_category_slugs;

  if (selectedCategories.length === 0) {
    return { criteria: [], hasCategoryOverlap: true };
  }

  const totalSpend = selectedCategories.reduce(
    (total, categorySlug) =>
      total + (spendingByCategory.get(categorySlug) ?? 0),
    0,
  );
  const matchedRewards = card.rewardCategories.filter((reward) =>
    selectedCategories.includes(reward.categorySlug),
  );
  const matchedSpend = matchedRewards.reduce(
    (total, reward) =>
      total + (spendingByCategory.get(reward.categorySlug) ?? 0),
    0,
  );
  const overlapRatio = totalSpend === 0 ? 0 : matchedSpend / totalSpend;
  const matchedLabels = matchedRewards.map((reward) => reward.categoryLabel);

  const rewardValue = matchedRewards.reduce(
    (total, reward) =>
      total +
      cappedMonthlyValue(
        card,
        reward,
        spendingByCategory.get(reward.categorySlug) ?? 0,
      ),
    0,
  );
  const rewardValueRate = totalSpend === 0 ? 0 : rewardValue / totalSpend;
  const spendingFit = overlapRatio * Math.min(rewardValueRate / 5, 1);

  return {
    hasCategoryOverlap: matchedRewards.length > 0,
    criteria: [
      {
        maximumScore: CATEGORY_WEIGHT,
        score: overlapRatio * CATEGORY_WEIGHT,
        reason:
          matchedLabels.length > 0
            ? `${matchedLabels.join(', ')}: category match`
            : 'Selected categories: no matching rewards',
      },
      {
        maximumScore: SPENDING_WEIGHT,
        score: spendingFit * SPENDING_WEIGHT,
        reason:
          matchedRewards.length > 0
            ? 'Monthly spending: fits this card’s reward structure'
            : 'Monthly spending: no selected-category rewards to estimate',
      },
    ],
  };
}

function creditCriterion(
  card: CatalogCard,
  surveyAnswers: SurveySubmission,
): { criterion: Criterion; status: 'fit' | 'unknown' | 'outside' } {
  const userLevel = surveyAnswers.credit_score_band;
  if (userLevel === 'unsure' || !(userLevel in CREDIT_LEVEL_SCORE)) {
    return {
      status: 'unknown',
      criterion: {
        maximumScore: CREDIT_WEIGHT,
        score: 8,
        reason: 'Credit range: unknown, so this card is rated Okay',
      },
    };
  }

  const requiredLevel = card.creditLevelRequired ?? 'none';
  const userScore = CREDIT_LEVEL_SCORE[userLevel as CreditLevel];
  const requiredScore = CREDIT_LEVEL_SCORE[requiredLevel];
  const fits = userScore >= requiredScore;

  return {
    status: fits ? 'fit' : 'outside',
    criterion: {
      maximumScore: CREDIT_WEIGHT,
      score: fits ? CREDIT_WEIGHT : 3,
      reason: fits
        ? 'Credit range: confirmed fit'
        : 'Credit range: outside the preferred range',
    },
  };
}

function preferenceCriteria(
  card: CatalogCard,
  surveyAnswers: SurveySubmission,
): Criterion[] {
  const annualFeeFits =
    surveyAnswers.accepts_annual_fee || card.annualFee === 0;
  const goalFits =
    (surveyAnswers.primary_goal === 'cash_back' &&
      card.rewardType === 'cashback') ||
    (surveyAnswers.primary_goal === 'travel_rewards' &&
      (card.rewardType === 'points' || card.rewardType === 'miles')) ||
    (surveyAnswers.primary_goal === 'building_credit' &&
      (card.isSecured || card.creditLevelRequired === 'none')) ||
    (surveyAnswers.primary_goal === 'low_or_no_annual_fee' &&
      card.annualFee === 0) ||
    (surveyAnswers.primary_goal === 'intro_0_apr' &&
      card.introOffer?.includes('0%'));

  return [
    {
      maximumScore: PREFERENCE_WEIGHT / 2,
      score: annualFeeFits ? PREFERENCE_WEIGHT / 2 : 0,
      reason: annualFeeFits
        ? 'Annual fee: matches your preference'
        : 'Annual fee: does not match your preference',
    },
    {
      maximumScore: PREFERENCE_WEIGHT / 2,
      score: goalFits ? PREFERENCE_WEIGHT / 2 : 0,
      reason: goalFits
        ? 'Primary goal: matches your preference'
        : 'Primary goal: rewards may not match your preference',
    },
  ];
}

export function getCardMatch(
  card: CatalogCard,
  context: RankingContext,
): CardMatch {
  if (!context.surveyAnswers) {
    return {
      rating: null,
      score: 0,
      maximumScore: 0,
      hasCategoryOverlap: true,
      reasons: [],
    };
  }

  const categories = categoryCriteria(card, context.surveyAnswers);
  const credit = creditCriterion(card, context.surveyAnswers);
  const criteria = [
    ...categories.criteria,
    credit.criterion,
    ...preferenceCriteria(card, context.surveyAnswers),
  ];
  const score = criteria.reduce(
    (total, criterion) => total + criterion.score,
    0,
  );
  const maximumScore = criteria.reduce(
    (total, criterion) => total + criterion.maximumScore,
    0,
  );
  const percentage = maximumScore === 0 ? 0 : (score / maximumScore) * 100;
  const rating =
    categories.hasCategoryOverlap &&
    credit.status === 'fit' &&
    percentage >= BEST_MATCH_THRESHOLD
      ? 'Best match'
      : categories.hasCategoryOverlap && percentage >= OKAY_THRESHOLD
        ? 'Okay'
        : null;

  return {
    rating,
    score,
    maximumScore,
    hasCategoryOverlap: categories.hasCategoryOverlap,
    reasons: criteria.map((criterion) => criterion.reason),
  };
}

export function getCardMatchRating(
  card: CatalogCard,
  context: RankingContext,
): CardMatchRating {
  return getCardMatch(card, context).rating;
}

export function rankCards(
  cards: CatalogCard[],
  context: RankingContext,
): CatalogCard[] {
  return [...cards].sort((left, right) => {
    const scoreDifference =
      getCardMatch(right, context).score - getCardMatch(left, context).score;

    return scoreDifference || left.cardName.localeCompare(right.cardName);
  });
}

export function cardsWithCategoryOverlap(
  cards: CatalogCard[],
  surveyAnswers: SurveySubmission,
): CatalogCard[] {
  return cards.filter(
    (card) =>
      getCardMatch(card, { activeFilters: [], surveyAnswers })
        .hasCategoryOverlap,
  );
}
