import { describe, expect, it } from 'vitest';

import { selectComparisonCards } from '../../lib/catalog/comparison';
import {
  parseComparisonIds,
  toggleComparisonId,
} from '../../lib/storage/comparison-storage';
import { catalogFixture } from '../fixtures/catalog';

describe('comparison data', () => {
  it('joins rewards by category and card, retaining terms and active visibility', () => {
    const cards = selectComparisonCards({
      ...catalogFixture,
      cardRewards: [
        {
          ...catalogFixture.cardRewards[0],
          spend_cap: 1500,
          cap_period: 'quarter',
          rate_after_cap: 0.5,
          notes: 'Enrollment required',
        },
        {
          ...catalogFixture.cardRewards[2],
          spend_cap: 1500,
          cap_period: 'quarter',
          rate_after_cap: 0.5,
          notes: 'Enrollment required',
        },
      ],
    });
    expect(cards.map((card) => card.cardId)).toEqual([10, 11]);
    expect(cards[0].benefits).toEqual(['First benefit', 'Second benefit']);
    expect(cards[0].rewards).toEqual([
      expect.objectContaining({
        categoryId: 21,
        categoryName: 'Groceries',
        rate: 2,
        spendCap: 1500,
        capPeriod: 'quarter',
        rateAfterCap: 0.5,
        notes: 'Enrollment required',
      }),
    ]);
    expect(cards[1].rewards).toEqual([
      expect.objectContaining({
        categoryId: 20,
        categoryName: 'Other',
        rate: 1,
        spendCap: 1500,
        capPeriod: 'quarter',
        rateAfterCap: 0.5,
        notes: 'Enrollment required',
      }),
    ]);
    expect(cards[1].introOffer).toBeNull();
  });
});

describe('comparison selection', () => {
  it('validates stored identifiers, removes duplicates and bounds the selection', () => {
    expect(parseComparisonIds(null)).toEqual([]);
    expect(parseComparisonIds('not json')).toEqual([]);
    expect(parseComparisonIds('{"ids":[1]}')).toEqual([]);
    expect(
      parseComparisonIds('[11,10,11,"12",null,-1,0,1.5,13,14,15]'),
    ).toEqual([11, 10, 13, 14]);
  });

  it('adds in order, removes selected cards and stops at four', () => {
    expect(toggleComparisonId([11], 10)).toEqual([11, 10]);
    expect(toggleComparisonId([11, 10], 11)).toEqual([10]);
    expect(toggleComparisonId([10, 11, 12, 13], 14)).toEqual([10, 11, 12, 13]);
    expect(toggleComparisonId([10, 11, 12, 13], 11)).toEqual([10, 12, 13]);
  });
});
