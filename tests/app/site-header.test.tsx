import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { pathname } = vi.hoisted(() => ({ pathname: { current: '/' } }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }));

import { ComparisonProvider } from '../../components/comparison-provider';
import { SiteHeader } from '../../components/site-header';

describe('SiteHeader', () => {
  afterEach(cleanup);

  it('shows navigation and login without the removed help artifact', () => {
    render(
      <ComparisonProvider>
        <SiteHeader />
      </ComparisonProvider>,
    );

    expect(
      screen.getByRole('link', { name: 'Credit Card FAQ' }),
    ).toHaveAttribute('href', '/learn');
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.queryByText('(?)')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /help/i }),
    ).not.toBeInTheDocument();
  });

  it('shows Survey and Card Catalog in navigation order', () => {
    render(
      <ComparisonProvider>
        <SiteHeader />
      </ComparisonProvider>,
    );

    const links = screen
      .getByRole('navigation', { name: 'Primary navigation' })
      .querySelectorAll('a');

    expect(
      [...links].map((link) => link.textContent?.replace(/\s+/gu, ' ').trim()),
    ).toEqual(['Survey', 'Card Catalog', 'Credit Card FAQ', 'Legal']);
  });

  it('marks the current page and shows a fallback avatar for a signed-in user', () => {
    pathname.current = '/survey';
    render(<SiteHeader username="alex" />);

    expect(screen.getByRole('link', { name: 'Survey' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('link', { name: 'Card Catalog' }),
    ).not.toHaveAttribute('aria-current');
    expect(
      screen.getByRole('img', { name: 'alex profile picture' }),
    ).toBeInTheDocument();
    pathname.current = '/';
  });

  it('shows the provided avatar and marks the catalog route', () => {
    pathname.current = '/results';
    render(
      <SiteHeader username="alex" avatarUrl="https://example.com/avatar.png" />,
    );

    expect(screen.getByRole('link', { name: 'Card Catalog' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('img', { name: 'alex profile picture' }),
    ).toHaveAttribute('src', 'https://example.com/avatar.png');
    pathname.current = '/';
  });

  it('opens account actions from the avatar without showing the username in the navbar', () => {
    render(<SiteHeader username="alex" />);

    const menuButton = screen.getByText('Open account menu');
    expect(menuButton).toBeInTheDocument();
    expect(menuButton.closest('summary')).not.toHaveTextContent('alex');

    fireEvent.click(menuButton);
    const menu = screen.getByRole('group', { name: 'Account menu' });
    expect(within(menu).getByText('alex')).toBeInTheDocument();
    expect(
      within(menu).getByRole('link', { name: 'Account details' }),
    ).toHaveAttribute('href', '/account');
    expect(
      within(menu).getByRole('link', { name: 'Bookmarked cards' }),
    ).toHaveAttribute('href', '/bookmarks');
    expect(
      within(menu).getByRole('button', { name: 'Log out' }),
    ).toBeInTheDocument();
    expect(menu.querySelector('.account-avatar')).toBeInTheDocument();
  });
});
