import { describe, expect, it } from 'vitest';

import { findMissingFilterSlugs } from '../../lib/results/missing-filters';

describe('findMissingFilterSlugs', () => {
  it('returns unique missing references in their original order', () => {
    expect(
      findMissingFilterSlugs(
        ['cashback', 'no-annual-fee', 'cashback', 'new-to-credit'],
        [{ slug: 'cashback' }],
      ),
    ).toEqual(['no-annual-fee', 'new-to-credit']);
  });

  it('returns no missing slugs when every reference is in the catalog', () => {
    expect(
      findMissingFilterSlugs(
        ['cashback', 'no-annual-fee'],
        [{ slug: 'cashback' }, { slug: 'no-annual-fee' }],
      ),
    ).toEqual([]);
  });
});
