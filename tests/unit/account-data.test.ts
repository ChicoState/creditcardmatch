import { describe, expect, it } from 'vitest';

import { availableRosterCards } from '../../lib/account/data';
import type { CatalogCard } from '../../lib/catalog/types';

const card = (cardId: number, cardName: string): CatalogCard => ({
  cardId,
  slug: cardName.toLowerCase().replaceAll(' ', '-'),
  issuer: 'Test issuer',
  cardName,
  network: null,
  pointValueCents: null,
  annualFee: 0,
  annualFeeWaivedFirstYear: false,
  oneTimeFee: null,
  monthlyFee: null,
  foreignTransactionFeePercent: null,
  isSecured: false,
  securityDepositMin: null,
  introOffer: null,
  applyUrl: null,
  imageUrl: null,
  description: null,
  rewardType: 'cashback',
  creditLevelRequired: null,
  isVerified: true,
  rewardCategories: [],
  benefits: [],
  filterSlugs: [],
});

describe('availableRosterCards', () => {
  it('excludes cards already associated with the user', () => {
    const cards = [card(1, 'One'), card(2, 'Two')];

    expect(availableRosterCards(cards, [cards[0]])).toEqual([cards[1]]);
  });
});
