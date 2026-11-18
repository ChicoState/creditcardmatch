import { describe, expect, it } from 'vitest';
import { parseDetails, DetailsError } from '../../lib/card-requests/details';
const vocabulary = { filters: new Set([1]), categories: new Set([2]) };
const input = {
  card_name: ' Card ',
  issuer: ' Bank ',
  source_url: 'https://example.com/card',
  filter_ids: [1],
};
describe('card request details', () => {
  it('preserves unknown values and trims text', () => {
    expect(parseDetails(input, vocabulary)).toMatchObject({
      card_name: 'Card',
      annual_fee: null,
      is_secured: null,
    });
  });
  it('reports field errors for invalid links, tags, and numbers', () => {
    for (const change of [
      { source_url: 'javascript:alert(1)' },
      { filter_ids: [99] },
      { annual_fee: -1 },
    ]) {
      expect(() => parseDetails({ ...input, ...change }, vocabulary)).toThrow(
        DetailsError,
      );
    }
  });
  it('requires verified matching essentials at publication', () => {
    expect(() => parseDetails(input, vocabulary, true)).toThrow(DetailsError);
    expect(
      parseDetails(
        {
          ...input,
          annual_fee: 0,
          reward_type: 'none',
          is_secured: false,
          annual_fee_waived_first_year: false,
        },
        vocabulary,
        true,
      ),
    ).toMatchObject({ annual_fee: 0 });
  });
  it('requires rates and point value for points and validates caps', () => {
    const points = {
      ...input,
      annual_fee: 0,
      reward_type: 'points',
      is_secured: false,
      annual_fee_waived_first_year: false,
    };
    expect(() => parseDetails(points, vocabulary, true)).toThrow();
    expect(() =>
      parseDetails(
        {
          ...points,
          point_value_cents: 1,
          rewards: [{ category_id: 2, reward_rate: 2, spend_cap: 100 }],
        },
        vocabulary,
        true,
      ),
    ).toThrow();
    expect(
      parseDetails(
        {
          ...points,
          point_value_cents: 1,
          rewards: [{ category_id: 2, reward_rate: 2 }],
        },
        vocabulary,
        true,
      ).rewards,
    ).toHaveLength(1);
  });
  it('rejects duplicate categories and oversized catalog strings', () => {
    expect(() =>
      parseDetails(
        {
          ...input,
          rewards: [
            { category_id: 2, reward_rate: 1 },
            { category_id: 2, reward_rate: 2 },
          ],
        },
        vocabulary,
      ),
    ).toThrow();
    expect(() =>
      parseDetails({ ...input, issuer: 'x'.repeat(51) }, vocabulary, true),
    ).toThrow();
  });
});
