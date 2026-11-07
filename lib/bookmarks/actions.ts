'use server';

import { revalidatePath } from 'next/cache';

import { createAuthServerClient } from '../auth/server';

export interface BookmarkActionResult {
  ok: boolean;
  error?: string;
}

function validCardId(cardId: number): boolean {
  return Number.isSafeInteger(cardId) && cardId > 0;
}

export async function toggleBookmark(
  cardId: number,
  bookmarked: boolean,
): Promise<BookmarkActionResult> {
  if (!validCardId(cardId) || typeof bookmarked !== 'boolean') {
    return { ok: false, error: 'That bookmark request is invalid.' };
  }

  const auth = await createAuthServerClient();
  const { data: userData } = await auth.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false, error: 'Please log in to bookmark cards.' };

  if (bookmarked) {
    const { data: card, error: cardError } = await auth
      .from('credit_cards')
      .select('card_id, is_active')
      .eq('card_id', cardId)
      .maybeSingle();
    if (cardError || !card?.is_active) {
      return { ok: false, error: 'That card is no longer available.' };
    }

    const username = user.user_metadata?.username;
    const { error: profileError } = await auth.from('profiles').upsert(
      {
        id: user.id,
        first_name: typeof username === 'string' ? username : null,
      },
      { onConflict: 'id' },
    );
    if (profileError) {
      return { ok: false, error: 'We could not save that bookmark.' };
    }

    const { error } = await auth
      .from('bookmarks')
      .upsert(
        { user_id: user.id, card_id: cardId },
        { onConflict: 'user_id,card_id', ignoreDuplicates: true },
      );
    if (error) return { ok: false, error: 'We could not save that bookmark.' };
  } else {
    const { error } = await auth
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('card_id', cardId);
    if (error)
      return { ok: false, error: 'We could not remove that bookmark.' };
  }

  revalidatePath('/results');
  revalidatePath('/bookmarks');
  return { ok: true };
}
