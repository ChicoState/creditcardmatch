import type { SupabaseClient, User } from '@supabase/supabase-js';

export function accountName(user: User): string {
  const { username } = user.user_metadata;
  return typeof username === 'string' && username ? username : 'Account';
}

export function ownedAvatarPath(user: User): string | undefined {
  const path = user.user_metadata.avatar_path;
  return typeof path === 'string' &&
    new RegExp(`^${user.id}/[a-f0-9-]+\\.webp$`).test(path)
    ? path
    : undefined;
}

export async function accountAvatarUrl(
  user: User,
  auth: SupabaseClient,
): Promise<string | undefined> {
  const path = ownedAvatarPath(user);
  if (path) {
    const { data } = await auth.storage
      .from('avatars')
      .createSignedUrl(path, 3600);
    return data?.signedUrl;
  }
  const url = user.user_metadata.avatar_url;
  return typeof url === 'string' && /^https?:\/\//i.test(url) ? url : undefined;
}
