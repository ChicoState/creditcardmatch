export const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const PASSWORD_MIN_LENGTH = 8;

export interface AuthFieldErrors {
  username?: string;
  password?: string;
}

export function validateUsername(username: string): string | undefined {
  if (
    username.length < USERNAME_MIN_LENGTH ||
    username.length > USERNAME_MAX_LENGTH
  ) {
    return 'Username must be 3–30 characters.';
  }

  if (!USERNAME_PATTERN.test(username)) {
    return 'Username may contain only letters, numbers, and underscores.';
  }

  return undefined;
}

export function validateSignupPassword(password: string): string | undefined {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return 'Password must be at least 8 characters.';
  }

  if (!/\d/u.test(password)) {
    return 'Password must contain at least one digit.';
  }

  return undefined;
}

export function encodeUsernameAsEmail(username: string): string {
  const encoded = Array.from(username, (character) =>
    character.charCodeAt(0).toString(16).padStart(2, '0'),
  ).join('');

  return `${encoded}@accounts.invalid`;
}
