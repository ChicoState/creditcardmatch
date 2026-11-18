'use server';

import { revalidatePath } from 'next/cache';
import { createAuthAdminClient, createAuthServerClient } from '../auth/server';
import { getCatalogData } from '../data/catalog';
import { DetailsError, parseDetails } from './details';
import type { RequestResult } from './types';

async function actor(admin: boolean) {
  const auth = await createAuthServerClient();
  const { data, error } = await auth.auth.getUser();
  if (error || !data.user) return null;
  if (admin) {
    const check = await auth.rpc('is_admin');
    if (check.error || check.data !== true) return null;
  }
  return data.user;
}
async function details(input: unknown, publish = false, draft = false) {
  const catalog = await getCatalogData();
  return parseDetails(
    input,
    {
      filters: new Set(catalog.filters.map((f) => f.filter_id)),
      categories: new Set(catalog.rewardCategories.map((c) => c.category_id)),
    },
    publish,
    draft,
  );
}
function failure(error: unknown): RequestResult {
  if (error instanceof DetailsError)
    return {
      ok: false,
      code: 'validation',
      message: error.message,
      fields: error.fields,
    };
  return {
    ok: false,
    code: 'persistence',
    message: 'Unable to save the request. Please try again.',
  };
}
function refresh(requestId?: number) {
  for (const path of [
    '/account/card-requests',
    '/admin/card-requests',
    '/results',
    '/compare',
    '/account/current-cards',
    '/bookmarks',
  ])
    revalidatePath(path);
  if (requestId) revalidatePath(`/admin/card-requests/${requestId}`);
}
export async function submitCardRequest(
  input: unknown,
): Promise<RequestResult> {
  try {
    const user = await actor(false);
    if (!user)
      return {
        ok: false,
        code: 'unauthorized',
        message: 'Please sign in to submit a card.',
      };
    const parsed = await details(input);
    const { data, error } = await createAuthAdminClient()
      .from('card_requests')
      .insert({
        user_id: user.id,
        card_name: parsed.card_name,
        issuer: parsed.issuer,
        reward_types: [],
        comments: parsed.comments,
        submission_details: parsed,
        status: 'pending',
      })
      .select('request_id')
      .single();
    if (error) return failure(error);
    refresh();
    return { ok: true, requestId: data.request_id };
  } catch (error) {
    return failure(error);
  }
}
export async function reviewCardRequest(input: {
  requestId: number;
  revision: number;
  action: 'save' | 'publish' | 'link' | 'deny';
  details?: unknown;
  note?: string;
  cardId?: number;
  verified?: boolean;
}): Promise<RequestResult> {
  try {
    const user = await actor(true);
    if (!user)
      return {
        ok: false,
        code: 'forbidden',
        message: 'Admin access is required.',
      };
    if (
      !input ||
      !Number.isSafeInteger(input.requestId) ||
      input.requestId < 1 ||
      !Number.isSafeInteger(input.revision) ||
      input.revision < 0 ||
      !['save', 'publish', 'link', 'deny'].includes(input.action)
    )
      return {
        ok: false,
        code: 'validation',
        message: 'Invalid review request.',
      };
    const note = typeof input.note === 'string' ? input.note.trim() : '';
    if (note.length > 2000 || (input.action === 'deny' && !note))
      return {
        ok: false,
        code: 'validation',
        message: 'Enter a decision note of 1–2,000 characters.',
        fields: {
          decision_note: 'Enter a decision note of 1–2,000 characters.',
        },
      };
    if (
      input.action === 'link' &&
      (!Number.isSafeInteger(input.cardId) || input.cardId! < 1)
    )
      return {
        ok: false,
        code: 'validation',
        message: 'Choose an existing card.',
      };
    if (input.action === 'publish' && input.verified !== true)
      return {
        ok: false,
        code: 'validation',
        message: 'Confirm official-source verification.',
        fields: { verified: 'Confirm verification before publishing.' },
      };
    const parsed = ['save', 'publish'].includes(input.action)
      ? await details(
          input.details,
          input.action === 'publish',
          input.action === 'save',
        )
      : null;
    const { error } = await createAuthAdminClient().rpc('review_card_request', {
      p_actor: user.id,
      p_request: input.requestId,
      p_revision: input.revision,
      p_action: input.action,
      p_details: parsed,
      p_note: note || null,
      p_card: input.cardId ?? null,
      p_verified: input.verified === true,
    });
    if (error) {
      if (['40001', '23505', 'P0002'].includes(error.code))
        return {
          ok: false,
          code: 'conflict',
          message:
            'This request changed or the card already exists. Reload and review before continuing.',
        };
      return failure(error);
    }
    refresh(input.requestId);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
