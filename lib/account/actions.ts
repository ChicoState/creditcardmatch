'use server';

import { revalidatePath } from 'next/cache';

import { getCatalogData } from '../data/catalog';
import { createAuthServerClient } from '../auth/server';
import { selectVisibleCatalogCards } from '../catalog/visibility';
import type { SurveySubmission } from '../config/survey';
import { parseCardRequest } from '../card-requests/validation';

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

export async function saveSurveyAnswersAction(
  submission: SurveySubmission,
): Promise<void> {
  if (!isPersistableSurveySubmission(submission)) return;

  const user = await currentUser();
  if (!user) return;

  const auth = await createAuthServerClient();
  const { error: profileError } = await auth
    .from('profiles')
    .upsert({ id: user.id }, { onConflict: 'id' });
  if (profileError) throw new Error('Unable to save your account profile.');

  const { data: categories, error: categoryError } = await auth
    .from('reward_categories')
    .select('category_id, slug');
  if (categoryError) throw new Error('Unable to save your spending answers.');

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
  if (deleteError) throw new Error('Unable to update your spending answers.');

  if (spendRows.length > 0) {
    const { error: insertError } = await auth
      .from('user_category_spend')
      .insert(spendRows);
    if (insertError) throw new Error('Unable to update your spending answers.');
  }

  revalidatePath('/account');
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
  if (!submission || !Array.isArray(submission.category_monthly_spend)) {
    return false;
  }

  const seenCategories = new Set<string>();
  return submission.category_monthly_spend.every((item) => {
    if (
      !item ||
      typeof item.category_slug !== 'string' ||
      seenCategories.has(item.category_slug) ||
      !Number.isFinite(item.monthly_amount) ||
      item.monthly_amount <= 0 ||
      item.monthly_amount > 100_000_000
    ) {
      return false;
    }
    seenCategories.add(item.category_slug);
    return true;
  });
}
