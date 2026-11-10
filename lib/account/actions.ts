'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { getCatalogData } from '../data/catalog';
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
import { selectVisibleCatalogCards } from '../catalog/visibility';
import { isSurveySubmission, type SurveySubmission } from '../config/survey';
import { parseCardRequest } from '../card-requests/validation';

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

async function currentUser() {
  const { data } = await (await createAuthServerClient()).auth.getUser();
  return data.user;
}

async function isAdmin(
  auth: Awaited<ReturnType<typeof createAuthServerClient>>,
) {
  const { data, error } = await auth.rpc('is_admin');
  return !error && data === true;
}

function cardIdFromForm(formData: FormData): number | null {
  const value = Number(formData.get('card_id'));
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export async function addCardAction(formData: FormData): Promise<void> {
  const user = await currentUser();
  const cardId = cardIdFromForm(formData);
  if (!user || cardId === null) return;

  const cards = selectVisibleCatalogCards(await getCatalogData());
  if (!cards.some((card) => card.cardId === cardId)) return;

  const auth = await createAuthServerClient();
  const { error: profileError } = await auth
    .from('profiles')
    .upsert({ id: user.id }, { onConflict: 'id' });
  if (profileError) throw new Error('Unable to save your account profile.');

  const { error } = await auth
    .from('user_card_roster')
    .upsert(
      { user_id: user.id, card_id: cardId },
      { onConflict: 'user_id,card_id' },
    );
  if (error) throw new Error('Unable to add that card to your roster.');

  revalidatePath('/account/current-cards');
}

export async function removeCardAction(formData: FormData): Promise<void> {
  const user = await currentUser();
  const cardId = cardIdFromForm(formData);
  if (!user || cardId === null) return;

  const { error } = await (
    await createAuthServerClient()
  )
    .from('user_card_roster')
    .delete()
    .eq('user_id', user.id)
    .eq('card_id', cardId);
  if (error) throw new Error('Unable to remove that card from your roster.');

  revalidatePath('/account/current-cards');
}

export async function saveCardRosterAction(formData: FormData): Promise<void> {
  const user = await currentUser();
  if (!user) return;

  const selectedIds = [
    ...new Set(
      formData
        .getAll('card_id')
        .map((value) => Number(value))
        .filter((value) => Number.isSafeInteger(value) && value > 0),
    ),
  ];
  const cards = selectVisibleCatalogCards(await getCatalogData());
  const visibleIds = new Set(cards.map((card) => card.cardId));
  const cardIds = selectedIds.filter((cardId) => visibleIds.has(cardId));
  const auth = await createAuthServerClient();

  const { error: profileError } = await auth
    .from('profiles')
    .upsert({ id: user.id }, { onConflict: 'id' });
  if (profileError) throw new Error('Unable to save your account profile.');

  const { error: deleteError } = await auth
    .from('user_card_roster')
    .delete()
    .eq('user_id', user.id);
  if (deleteError) throw new Error('Unable to update your card roster.');

  if (cardIds.length > 0) {
    const { error: insertError } = await auth
      .from('user_card_roster')
      .insert(cardIds.map((cardId) => ({ user_id: user.id, card_id: cardId })));
    if (insertError) throw new Error('Unable to update your card roster.');
  }

  revalidatePath('/account/current-cards');
}

export interface SurveySaveResult {
  ok: boolean;
  requiresAuth?: boolean;
  error?: string;
}

export async function saveSurveyAnswersAction(
  submission: SurveySubmission,
): Promise<SurveySaveResult> {
  if (!isPersistableSurveySubmission(submission)) {
    return { ok: false, error: 'Those survey answers are invalid.' };
  }

  const user = await currentUser();
  if (!user) return { ok: false, requiresAuth: true };

  const auth = await createAuthServerClient();
  const { error: profileError } = await auth
    .from('profiles')
    .upsert({ id: user.id }, { onConflict: 'id' });
  if (profileError)
    return { ok: false, error: 'Unable to save your account profile.' };

  const { error: preferenceError } = await auth.from('user_preferences').upsert(
    {
      user_id: user.id,
      credit_score_range: submission.credit_score_band,
      income_range: submission.income_range,
      accepts_annual_fee: submission.accepts_annual_fee,
      wants_travel_rewards: submission.user_preferences.wants_travel_rewards,
      survey_answers: submission,
      survey_saved_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (preferenceError)
    return { ok: false, error: 'Unable to save your survey answers.' };

  const { data: categories, error: categoryError } = await auth
    .from('reward_categories')
    .select('category_id, slug');
  if (categoryError)
    return { ok: false, error: 'Unable to save your spending answers.' };

  const categoryIdBySlug = new Map(
    (categories ?? []).map((category) => [category.slug, category.category_id]),
  );
  const spendRows = submission.category_monthly_spend.flatMap((item) => {
    const categoryId = categoryIdBySlug.get(item.category_slug);
    return categoryId
      ? [
          {
            user_id: user.id,
            category_id: categoryId,
            monthly_amount: item.monthly_amount,
          },
        ]
      : [];
  });

  const { error: deleteError } = await auth
    .from('user_category_spend')
    .delete()
    .eq('user_id', user.id);
  if (deleteError)
    return { ok: false, error: 'Unable to update your spending answers.' };

  if (spendRows.length > 0) {
    const { error: insertError } = await auth
      .from('user_category_spend')
      .insert(spendRows);
    if (insertError)
      return { ok: false, error: 'Unable to update your spending answers.' };
  }

  const { data: filters, error: filterError } = await auth
    .from('filters')
    .select('filter_id, slug');
  if (filterError) return { ok: false, error: 'Unable to save your filters.' };
  const filterIdBySlug = new Map(
    (filters ?? []).map((filter) => [filter.slug, filter.filter_id]),
  );
  const filterRows = submission.user_filter_preferences.flatMap((item) => {
    const filterId = filterIdBySlug.get(item.filter_slug);
    return filterId
      ? [{ user_id: user.id, filter_id: filterId, preference: item.preference }]
      : [];
  });
  const { error: filterDeleteError } = await auth
    .from('user_filter_preferences')
    .delete()
    .eq('user_id', user.id);
  if (filterDeleteError)
    return { ok: false, error: 'Unable to update your saved filters.' };
  if (filterRows.length > 0) {
    const { error: filterInsertError } = await auth
      .from('user_filter_preferences')
      .insert(filterRows);
    if (filterInsertError)
      return { ok: false, error: 'Unable to update your saved filters.' };
  }

  revalidatePath('/account');
  revalidatePath('/survey');
  return { ok: true };
}

export async function clearSurveyAnswersAction(): Promise<SurveySaveResult> {
  const user = await currentUser();
  if (!user) return { ok: false, requiresAuth: true };

  const auth = await createAuthServerClient();
  const { error: preferenceError } = await auth
    .from('user_preferences')
    .update({
      survey_answers: null,
      survey_saved_at: null,
      credit_score_range: null,
      income_range: null,
      accepts_annual_fee: null,
      wants_travel_rewards: null,
    })
    .eq('user_id', user.id);
  if (preferenceError)
    return { ok: false, error: 'Unable to clear your saved survey.' };

  const { error: spendError } = await auth
    .from('user_category_spend')
    .delete()
    .eq('user_id', user.id);
  if (spendError)
    return { ok: false, error: 'Unable to clear your saved survey.' };

  const { error: filterError } = await auth
    .from('user_filter_preferences')
    .delete()
    .eq('user_id', user.id);
  if (filterError)
    return { ok: false, error: 'Unable to clear your saved survey.' };

  revalidatePath('/account');
  revalidatePath('/survey');
  return { ok: true };
}

export async function submitCardRequestAction(
  formData: FormData,
): Promise<void> {
  const user = await currentUser();
  if (!user) throw new Error('You must be signed in to request a card.');

  const catalog = await getCatalogData();
  const request = parseCardRequest(
    formData,
    new Set(catalog.rewardCategories.map((category) => category.slug)),
  );
  const auth = await createAuthServerClient();
  const { error } = await auth.from('card_requests').insert({
    user_id: user.id,
    card_name: request.cardName,
    issuer: request.issuer,
    reward_types: request.rewardTypes,
    notification_email: request.notificationEmail,
    comments: request.comments,
  });
  if (error) throw new Error('Unable to submit your card request.');

  revalidatePath('/account/current-cards');
}

export async function reviewCardRequestAction(
  formData: FormData,
): Promise<void> {
  const requestId = Number(formData.get('request_id'));
  const status = formData.get('status');
  if (!Number.isSafeInteger(requestId) || requestId <= 0) {
    throw new Error('Invalid card request.');
  }
  if (status !== 'approved' && status !== 'rejected') {
    throw new Error('Invalid card request decision.');
  }

  const user = await currentUser();
  if (!user) throw new Error('You must be signed in to review requests.');
  const auth = await createAuthServerClient();
  if (!(await isAdmin(auth)))
    throw new Error('You are not allowed to review requests.');

  const { error } = await auth
    .from('card_requests')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('request_id', requestId)
    .eq('status', 'pending');
  if (error) throw new Error('Unable to review the card request.');

  revalidatePath('/admin/card-requests');
}

function isPersistableSurveySubmission(submission: SurveySubmission): boolean {
  return isSurveySubmission(submission);
}
