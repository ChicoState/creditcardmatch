'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { logoutAction } from '../lib/auth/actions';
import { ComparisonLink } from './comparison-cart';

const navigationItems = [
  { label: 'Survey', href: '/survey' },
  { label: 'Card Catalog', href: '/results' },
  { label: 'Credit Card FAQ', href: '/learn' },
  { label: 'Legal', href: '/legal' },
] as const;

interface SiteHeaderProps {
  username?: string;
  avatarUrl?: string;
}

function AccountAvatar({
  username,
  avatarUrl,
}: {
  username: string;
  avatarUrl?: string;
}) {
  return avatarUrl ? (
    // Auth providers may host avatars outside our configured image domains.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="account-avatar"
      src={avatarUrl}
      alt={`${username} profile picture`}
    />
  ) : (
    <svg
      className="account-avatar"
      role="img"
      aria-label={`${username} profile picture`}
      viewBox="0 0 32 32"
      fill="none"
    >
      <circle cx="16" cy="16" r="15" fill="currentColor" opacity="0.12" />
      <circle cx="16" cy="12" r="5" fill="currentColor" />
      <path d="M6 27c1-6 5-9 10-9s9 3 10 9" fill="currentColor" />
    </svg>
  );
}

export function SiteHeader({ username, avatarUrl }: SiteHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link
          className="wordmark"
          href="/"
          aria-current={pathname === '/' ? 'page' : undefined}
        >
          CreditCardMatch
        </Link>
        <nav aria-label="Primary navigation" className="primary-nav">
          {navigationItems.map((item) => (
            <Link
              href={item.href}
              key={item.label}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="account-nav">
          {username ? (
            <details className="account-menu">
              <summary aria-label="Open account menu">
                <AccountAvatar username={username} avatarUrl={avatarUrl} />
                <span className="account-menu-label">Open account menu</span>
              </summary>
              <div
                className="account-menu-panel"
                role="group"
                aria-label="Account menu"
              >
                <div className="account-menu-identity">
                  <span aria-hidden="true">
                    <AccountAvatar username={username} avatarUrl={avatarUrl} />
                  </span>
                  <span className="account-username">{username}</span>
                </div>
                <Link
                  href="/account"
                  aria-current={pathname === '/account' ? 'page' : undefined}
                >
                  Account details
                </Link>
                <Link
                  href="/account/current-cards"
                  aria-current={
                    pathname === '/account/current-cards' ? 'page' : undefined
                  }
                >
                  Current Cards
                </Link>
                <Link
                  href="/bookmarks"
                  aria-current={pathname === '/bookmarks' ? 'page' : undefined}
                >
                  Bookmarked cards
                </Link>
                <form action={logoutAction}>
                  <button className="header-link-button" type="submit">
                    Log out
                  </button>
                </form>
              </div>
            </details>
          ) : (
            <Link
              href="/login"
              aria-current={pathname === '/login' ? 'page' : undefined}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
