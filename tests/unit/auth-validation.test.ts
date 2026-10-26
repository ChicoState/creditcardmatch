import { describe, expect, it } from 'vitest';

import {
  encodeUsernameAsEmail,
  validateSignupPassword,
  validateUsername,
} from '../../lib/auth/validation';

describe('auth validation', () => {
  it.each(['ab', 'a'.repeat(31), 'has-dash', 'has space', ''])(
    'rejects invalid username %j',
    (username) => {
      expect(validateUsername(username)).toBeTruthy();
    },
  );

  it.each(['abc', 'Alex_123', 'a'.repeat(30)])(
    'accepts valid username %j',
    (username) => {
      expect(validateUsername(username)).toBeUndefined();
    },
  );

  it('preserves case in the username adapter', () => {
    expect(encodeUsernameAsEmail('Alex')).toBe('416c6578@accounts.invalid');
    expect(encodeUsernameAsEmail('alex')).toBe('616c6578@accounts.invalid');
  });

  it.each(['short1', 'abcdefgh', 'password'])(
    'rejects weak signup password %j',
    (password) => {
      expect(validateSignupPassword(password)).toBeTruthy();
    },
  );

  it('accepts an eight-character password containing a digit', () => {
    expect(validateSignupPassword('abcdef1g')).toBeUndefined();
  });
});
