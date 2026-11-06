export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateAccountField(
  field: 'name' | 'email',
  input: unknown,
): { value: string; error?: never } | { error: string; value?: never } {
  if (typeof input !== 'string') return { error: 'Enter a valid value.' };
  const value = input.trim();
  if (field === 'name' && (!value || value.length > 80)) {
    return { error: 'Name must be 1–80 characters.' };
  }
  if (
    field === 'email' &&
    value &&
    (value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value))
  ) {
    return { error: 'Enter a valid email address, or leave it empty.' };
  }
  return { value };
}
