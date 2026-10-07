import { describe, expect, it } from 'vitest';

import {
  addFilterSlug,
  buildResultsHref,
  parseFilterSlugs,
  removeFilterSlug,
} from '../../lib/results/query-string';

describe('results query-string helpers', () => {
  it('parses valid comma-separated slugs and removes duplicates', () => {
    expect(
      parseFilterSlugs('cashback,new-to-credit,cashback,NOT VALID'),
    ).toEqual(['cashback', 'new-to-credit']);
  });

  it('builds the unfiltered and filtered results URLs', () => {
    expect(buildResultsHref([])).toBe('/results');
    expect(buildResultsHref(['cashback', 'new-to-credit'])).toBe(
      '/results?filters=cashback,new-to-credit',
    );
  });

  it('adds and removes filters without mutating the input', () => {
    const original = ['cashback'];

    expect(addFilterSlug(original, 'new-to-credit')).toEqual([
      'cashback',
      'new-to-credit',
    ]);
    expect(removeFilterSlug(original, 'cashback')).toEqual([]);
    expect(original).toEqual(['cashback']);
  });
});
