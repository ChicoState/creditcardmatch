'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { createAuthServerClient } from '../auth/server';
import { prepareAvatar } from './avatar';
import { ownedAvatarPath } from './server';
import { AVATAR_MAX_BYTES, validateAccountField } from './validation';

export interface AccountSaveResult {
  error?: string;
  success?: true;
}

export async function saveAccountDetails(
  form: FormData,
): Promise<AccountSaveResult> {
  try {
    const auth = await createAuthServerClient();
    const {
      data: { user },
      error,
    } = await auth.auth.getUser();
    if (error || !user)
      return { error: 'Your session has expired. Please log in again.' };
    const field = form.get('field');
    if (field === 'name' || field === 'email') {
      const result = validateAccountField(field, form.get('value'));
      if (result.error) return { error: result.error };
      const key = field === 'name' ? 'display_name' : 'contact_email';
      const { error: saveError } = await auth.auth.updateUser({
        data: { [key]: result.value },
      });
      if (saveError)
        return { error: 'We could not save your changes. Please try again.' };
    } else if (field === 'photo') {
      const file = form.get('photo');
      if (
        !(file instanceof File) ||
        !file.size ||
        file.size > AVATAR_MAX_BYTES
      ) {
        return { error: 'Choose a JPEG, PNG, or WebP photo up to 2 MB.' };
      }
      let bytes: Buffer;
      try {
        bytes = await prepareAvatar(
          Buffer.from(await file.arrayBuffer()),
          file.type,
        );
      } catch {
        return {
          error:
            'Choose a valid, still JPEG, PNG, or WebP photo up to 2 MB (maximum 16 megapixels).',
        };
      }
      const path = `${user.id}/${randomUUID()}.webp`;
      const bucket = auth.storage.from('avatars');
      const { error: uploadError } = await bucket.upload(path, bytes, {
        contentType: 'image/webp',
        upsert: false,
      });
      if (uploadError)
        return { error: 'We could not upload your photo. Please try again.' };
      // Never accept a user ID or storage path supplied by the browser.
      let saved = false;
      try {
        const { error: saveError } = await auth.auth.updateUser({
          data: { avatar_path: path },
        });
        if (saveError)
          return { error: 'We could not save your photo. Please try again.' };
        saved = true;
      } finally {
        if (!saved) await bucket.remove([path]).catch(() => undefined);
      }
      const previous = ownedAvatarPath(user);
      if (previous) {
        const cleanup = await bucket
          .remove([previous])
          .catch(() => ({ error: true }));
        if (cleanup.error) console.warn('Account avatar cleanup failed.');
      }
    } else return { error: 'Choose a valid account field.' };
    revalidatePath('/', 'layout');
    return { success: true };
  } catch {
    return { error: 'We could not save your changes. Please try again.' };
  }
}
