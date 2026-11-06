import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { validateAccountField } from '../../lib/account/validation';
import { prepareAvatar } from '../../lib/account/avatar';

describe('account details validation', () => {
  it('trims names and rejects blank or overlong names', () => {
    expect(validateAccountField('name', '  Alex  ')).toEqual({ value: 'Alex' });
    expect(validateAccountField('name', '  ')).toHaveProperty('error');
    expect(validateAccountField('name', 'a'.repeat(81))).toHaveProperty(
      'error',
    );
  });
  it('accepts contact email or clearing it, and rejects malformed input', () => {
    expect(validateAccountField('email', ' me@example.com ')).toEqual({
      value: 'me@example.com',
    });
    expect(validateAccountField('email', '')).toEqual({ value: '' });
    expect(validateAccountField('email', 'not an email')).toHaveProperty(
      'error',
    );
  });
  it('decodes real images and normalizes them to WebP', async () => {
    const input = await sharp({
      create: { width: 600, height: 200, channels: 3, background: '#155c45' },
    })
      .png()
      .toBuffer();
    const output = await prepareAvatar(input, 'image/png');
    const metadata = await sharp(output).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(512);
  });
  it('rejects forged, corrupt, disallowed, and oversized photos', async () => {
    await expect(
      prepareAvatar(Buffer.from('fake png'), 'image/png'),
    ).rejects.toThrow();
    await expect(
      prepareAvatar(Buffer.from('<svg/>'), 'image/svg+xml'),
    ).rejects.toThrow();
    await expect(
      prepareAvatar(Buffer.alloc(2 * 1024 * 1024 + 1), 'image/png'),
    ).rejects.toThrow();
  });
});
