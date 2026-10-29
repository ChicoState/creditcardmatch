import { describe, expect, it } from 'vitest';

import {
  addFilterSlug,
  buildResultsHref,
  parseFilterSlugs,
  parseResultsMode,
  removeFilterSlug,
} from '../../lib/results/query-string';

describe('results query-string helpers', () => {
  it('parses valid comma-separated slugs and removes duplicates', () => {
    expect(
      parseFilterSlugs('cashback,no-credit-history,cashback,NOT VALID'),
    ).toEqual(['cashback', 'no-credit-history']);
  });

  it('builds the unfiltered and filtered results URLs', () => {
    expect(buildResultsHref([])).toBe('/results');
    expect(buildResultsHref(['cashback', 'no-credit-history'])).toBe(
      '/results?filters=cashback,no-credit-history',
    );
    expect(buildResultsHref(['cashback'], 'survey')).toBe(
      '/results?mode=survey&filters=cashback',
    );
  });

  it('adds and removes filters without mutating the input', () => {
    const original = ['cashback'];

    expect(addFilterSlug(original, 'no-credit-history')).toEqual([
      'cashback',
      'no-credit-history',
    ]);
    expect(removeFilterSlug(original, 'cashback')).toEqual([]);
    expect(original).toEqual(['cashback']);
  });

  it('defaults unknown result modes to neutral browsing', () => {
    expect(parseResultsMode(undefined)).toBe('browse');
    expect(parseResultsMode('anything-else')).toBe('browse');
    expect(parseResultsMode('survey')).toBe('survey');
  });
});
