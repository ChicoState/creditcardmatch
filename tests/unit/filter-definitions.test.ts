import {
  getConfirmedBenefitSlugs,
  getCatalogCategorySlugs,
  SURVEY_FILTER_MAPPINGS,
} from '../../lib/catalog/filter-definitions';
import { describe, expect, it } from 'vitest';

describe('catalog filter definitions', () => {
  it('maps survey categories to catalog category slugs', () => {
    expect(getCatalogCategorySlugs('shopping')).toEqual(['online_shopping']);
    expect(getCatalogCategorySlugs('streaming-entertainment')).toEqual([
      'streaming',
    ]);
    expect(getCatalogCategorySlugs('transit-rideshare')).toEqual([]);
  });

  it('returns no catalog categories for an unknown survey category', () => {
    expect(getCatalogCategorySlugs('unknown')).toEqual([]);
  });

  it('defines survey answer filter mappings outside the survey config', () => {
    expect(SURVEY_FILTER_MAPPINGS.annualFee.false).toBe('no-annual-fee');
    expect(SURVEY_FILTER_MAPPINGS.creditScore.none).toBe('no-credit-history');
    expect(SURVEY_FILTER_MAPPINGS.primaryGoal.cash_back).toBe('cashback');
  });

  it('only recognizes explicitly confirmed benefit evidence', () => {
    expect(
      getConfirmedBenefitSlugs([
        'Purchase protection for 120 days',
        'No foreign transaction fees',
      ]),
    ).toEqual(['no-foreign-transaction-fee', 'purchase-protection']);
    expect(
      getConfirmedBenefitSlugs(['A useful travel card', 'A welcome offer']),
    ).toEqual([]);
  });
});
