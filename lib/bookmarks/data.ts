import type { CatalogCard, CatalogSnapshot } from '../catalog/types';
import { selectVisibleCatalogCards } from '../catalog/visibility';
import { createAuthServerClient } from '../auth/server';

export interface BookmarkRow {
  card_id: number;
  created_at: string;
}

async function currentUserId(): Promise<string | null> {
  const { data } = await (await createAuthServerClient()).auth.getUser();
  return data.user?.id ?? null;
}

export async function getBookmarkedCardIds(): Promise<number[]> {
  try {
    const userId = await currentUserId();
    if (!userId) return [];

    const { data, error } = await (
      await createAuthServerClient()
    )
      .from('bookmarks')
      .select('card_id')
      .eq('user_id', userId);

    if (error) throw new Error('Unable to load your bookmarked cards.');
    return (data ?? []).map((row) => row.card_id as number);
  } catch {
    // Results can still be rendered when an optional auth request is unavailable.
    return [];
  }
}

export async function getBookmarkedCards(
  catalog: CatalogSnapshot,
): Promise<CatalogCard[]> {
  const userId = await currentUserId();
  if (!userId) return [];

  const { data, error } = await (
    await createAuthServerClient()
  )
    .from('bookmarks')
    .select('card_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Unable to load your bookmarked cards.');

  const visibleCards = new Map(
    selectVisibleCatalogCards(catalog).map((card) => [card.cardId, card]),
  );
  return ((data ?? []) as BookmarkRow[]).flatMap((row) => {
    const card = visibleCards.get(row.card_id);
    return card ? [card] : [];
  });
}
