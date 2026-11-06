import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { push, toggleBookmark } = vi.hoisted(() => ({
  push: vi.fn(),
  toggleBookmark: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('../../lib/bookmarks/actions', () => ({ toggleBookmark }));

import { BookmarkButton } from '../../components/bookmark-button';

describe('BookmarkButton', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('redirects signed-out users to login with the current path', () => {
    render(
      <BookmarkButton
        cardId={12}
        cardName="Harbor Starter Card"
        isAuthenticated={false}
        initialBookmarked={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /bookmark harbor/i }));

    expect(push).toHaveBeenCalledWith(
      `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
    );
    expect(toggleBookmark).not.toHaveBeenCalled();
  });

  it('optimistically toggles and confirms a bookmark for signed-in users', async () => {
    toggleBookmark.mockResolvedValue({ ok: true });
    render(
      <BookmarkButton
        cardId={12}
        cardName="Harbor Starter Card"
        isAuthenticated
        initialBookmarked={false}
      />,
    );

    const button = screen.getByRole('button', {
      name: 'Bookmark Harbor Starter Card',
    });
    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(toggleBookmark).toHaveBeenCalledWith(12, true));
  });

  it('rolls back and reports an action failure', async () => {
    toggleBookmark.mockResolvedValue({ ok: false, error: 'Save failed.' });
    render(
      <BookmarkButton
        cardId={12}
        cardName="Harbor Starter Card"
        isAuthenticated
        initialBookmarked={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /bookmark harbor/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Bookmark Harbor Starter Card' }),
      ).toHaveAttribute('aria-pressed', 'false');
    });
    expect(screen.getByRole('status')).toHaveTextContent('Save failed.');
  });

  it('rolls back when the bookmark action rejects unexpectedly', async () => {
    toggleBookmark.mockRejectedValue(new Error('Network failure'));
    render(
      <BookmarkButton
        cardId={12}
        cardName="Harbor Starter Card"
        isAuthenticated
        initialBookmarked={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /bookmark harbor/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'We could not update that bookmark.',
      );
    });
    expect(
      screen.getByRole('button', { name: 'Bookmark Harbor Starter Card' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });
});
