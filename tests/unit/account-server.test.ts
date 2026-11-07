import type { SupabaseClient, User } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import {
  accountAvatarUrl,
  accountName,
  ownedAvatarPath,
} from '../../lib/account/server';

describe('account presentation data', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  function user(metadata: Record<string, unknown>) {
    return { id, user_metadata: metadata } as User;
  }
  it('falls back to the username when no display name exists', () => {
    expect(
      accountName(
        user({ display_name: 'Old display name', username: 'login' }),
      ),
    ).toBe('login');
    expect(accountName(user({}))).toBe('Account');
  });
  it('never signs another user’s folder or traversal paths', () => {
    expect(
      ownedAvatarPath(user({ avatar_path: 'someone-else/photo.webp' })),
    ).toBeUndefined();
    expect(
      ownedAvatarPath(user({ avatar_path: `${id}/../photo.webp` })),
    ).toBeUndefined();
  });
  it('uses short-lived signed URLs for owned avatar files', async () => {
    const path = `${id}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp`;
    const createSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: 'https://storage.example/signed' },
    });
    const client = {
      storage: { from: () => ({ createSignedUrl }) },
    } as unknown as SupabaseClient;
    expect(await accountAvatarUrl(user({ avatar_path: path }), client)).toBe(
      'https://storage.example/signed',
    );
    expect(createSignedUrl).toHaveBeenCalledWith(path, 3600);
  });
  it('falls back safely when signing fails or an external URL is invalid', async () => {
    const client = {
      storage: {
        from: () => ({
          createSignedUrl: async () => ({ data: null, error: {} }),
        }),
      },
    } as unknown as SupabaseClient;
    expect(
      await accountAvatarUrl(
        user({ avatar_path: `${id}/aaaaaaaa.webp` }),
        client,
      ),
    ).toBeUndefined();
    expect(
      await accountAvatarUrl(
        user({ avatar_url: 'javascript:alert(1)' }),
        client,
      ),
    ).toBeUndefined();
  });
});
