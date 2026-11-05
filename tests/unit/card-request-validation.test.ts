import { describe, expect, it } from 'vitest';

import { parseCardRequest } from '../../lib/card-requests/validation';

describe('parseCardRequest', () => {
  it('trims and parses a valid request', () => {
    const formData = new FormData();
    formData.set('card_name', '  New Card ');
    formData.set('issuer', ' Issuer ');
    formData.append('reward_type', 'travel');
    formData.set('notification_email', 'person@example.com');
    formData.set('comments', 'Please review this card.');

    expect(parseCardRequest(formData, new Set(['travel']))).toEqual({
      cardName: 'New Card',
      issuer: 'Issuer',
      rewardTypes: ['travel'],
      notificationEmail: 'person@example.com',
      comments: 'Please review this card.',
    });
  });

  it('rejects unknown reward categories and malformed emails', () => {
    const formData = new FormData();
    formData.set('card_name', 'New Card');
    formData.set('issuer', 'Issuer');
    formData.append('reward_type', 'not-a-category');
    formData.set('notification_email', 'not-an-email');

    expect(() => parseCardRequest(formData, new Set(['travel']))).toThrow(
      'Choose at least one valid reward category.',
    );
  });
});
