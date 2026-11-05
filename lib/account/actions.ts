'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { createAuthAdminClient, createAuthServerClient } from '../auth/server';
import { consumeAuthRateLimit } from '../auth/rate-limit';
import {
  encodeUsernameAsEmail,
  validateUsername,
  validateSignupPassword,
} from '../auth/validation';
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
    if (field === 'username') {
      const username = form.get('value');
      const current = form.get('currentPassword');
      if (typeof username !== 'string')
        return { error: 'Enter a valid username.' };
      const invalid = validateUsername(username);
      if (invalid) return { error: invalid };
      if (typeof current !== 'string' || !current)
        return { error: 'Enter your current password.' };
      if (!(await consumeAuthRateLimit('login')))
        return { error: 'Too many attempts. Please try again later.' };
      if (!user.email) return { error: 'Please log in again.' };
      const { data: verified, error: verifyError } =
        await auth.auth.signInWithPassword({
          email: user.email,
          password: current,
        });
      if (verifyError || verified.user?.id !== user.id)
        return { error: 'Your current password is incorrect.' };
      // Login uses an encoded internal email. Update it and the visible username
      // in one Auth operation, scoped exclusively to the verified session owner.
      const { error: saveError } =
        await createAuthAdminClient().auth.admin.updateUserById(user.id, {
          email: encodeUsernameAsEmail(username),
          email_confirm: true,
          user_metadata: { username },
        });
      if (saveError) {
        if (
          saveError.code === 'email_exists' ||
          saveError.code === 'user_already_exists' ||
          /already registered|already exists/iu.test(saveError.message ?? '')
        )
          return { error: 'Username already taken.' };
        return {
          error: 'We could not change your username. Please try again.',
        };
      }
    } else if (field === 'password') {
      const current = form.get('currentPassword');
      const password = form.get('password');
      const confirmation = form.get('confirmation');
      if (
        typeof current !== 'string' ||
        !current ||
        typeof password !== 'string'
      )
        return { error: 'Enter your current and new passwords.' };
      const invalid = validateSignupPassword(password);
      if (invalid) return { error: invalid };
      if (password !== confirmation)
        return { error: 'New passwords must match.' };
      if (password === current)
        return { error: 'Choose a different new password.' };
      if (!(await consumeAuthRateLimit('login')))
        return { error: 'Too many attempts. Please try again later.' };
      if (!user.email) return { error: 'Please log in again.' };
      const { data: verified, error: verifyError } =
        await auth.auth.signInWithPassword({
          email: user.email,
          password: current,
        });
      if (verifyError || verified.user?.id !== user.id)
        return { error: 'Your current password is incorrect.' };
      const { error: saveError } = await auth.auth.updateUser({
        password,
        current_password: current,
      });
      if (saveError)
        return {
          error: 'We could not change your password. Please try again.',
        };
    } else if (field === 'email') {
      const result = validateAccountField(field, form.get('value'));
      if (result.error) return { error: result.error };
      const key = 'contact_email';
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
