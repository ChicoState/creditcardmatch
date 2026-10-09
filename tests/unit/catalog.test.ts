import { describe, expect, it } from 'vitest';

import { filterCards, searchCards } from '../../lib/catalog/filter-cards';
import { rankCards } from '../../lib/catalog/rank-cards';
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
      benefits: ['First benefit', 'Second benefit'],
    });
  });
});

describe('filterCards', () => {
  it('requires every active filter to match', () => {
    const cards = selectVisibleCatalogCards(catalogFixture);

    expect(
      filterCards(cards, ['cashback', 'new-to-credit']).map(
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
  it('uses card name as the neutral placeholder order', () => {
    const cards = selectVisibleCatalogCards(catalogFixture);

    expect(
      rankCards(cards, {
        activeFilters: ['cashback'],
        surveyAnswers: null,
      }).map((card) => card.cardName),
    ).toEqual(['Aurora Everyday Card', 'Harbor Starter Card']);
  });
});
