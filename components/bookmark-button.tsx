'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { toggleBookmark } from '../lib/bookmarks/actions';

interface BookmarkButtonProps {
  cardId: number;
  cardName: string;
  initialBookmarked: boolean;
  isAuthenticated: boolean;
}

export function BookmarkButton({
  cardId,
  cardName,
  initialBookmarked,
  isAuthenticated,
}: BookmarkButtonProps) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const label = `${bookmarked ? 'Remove' : 'Bookmark'} ${cardName}${
    bookmarked ? ' from bookmarks' : ''
  }`;

  function handleClick() {
    if (!isAuthenticated) {
      const next = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    const nextBookmarked = !bookmarked;
    setError(null);
    setBookmarked(nextBookmarked);
    startTransition(async () => {
      try {
        const result = await toggleBookmark(cardId, nextBookmarked);
        if (result.ok) return;
        setBookmarked(!nextBookmarked);
        setError(result.error ?? 'We could not update that bookmark.');
      } catch {
        setBookmarked(!nextBookmarked);
        setError('We could not update that bookmark.');
      }
    });
  }

  return (
    <div className="bookmark-control">
      <button
        aria-label={label}
        aria-pressed={bookmarked}
        className="bookmark-button"
        disabled={pending}
        onClick={handleClick}
        type="button"
      >
        <span aria-hidden="true">{bookmarked ? '★' : '☆'}</span>
        <span>{bookmarked ? 'Saved' : 'Save'}</span>
      </button>
      {error ? (
        <p className="bookmark-error" role="status">
          {error}
        </p>
      ) : null}
    </div>
  );
}
