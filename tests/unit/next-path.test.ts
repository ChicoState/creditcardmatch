import { describe, expect, it } from 'vitest';

import { safeNextPath } from '../../lib/auth/next-path';

describe('safeNextPath', () => {
  it('allows same-origin paths with queries and fragments', () => {
    expect(safeNextPath('/results?filters=cashback#cards')).toBe(
      '/results?filters=cashback#cards',
    );
  });

  it.each([
    'https://example.com/results',
    '//example.com/results',
    'javascript:alert(1)',
    '\\\\example.com/results',
  ])('rejects unsafe next value %s', (value) => {
    expect(safeNextPath(value)).toBe('/results');
  });
});
