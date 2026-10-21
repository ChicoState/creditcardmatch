import Link from 'next/link';

import { logoutAction } from '../lib/auth/actions';
import { ComparisonLink } from './comparison-cart';

const navigationItems = [
  { label: 'Credit Card FAQ', href: '/learn' },
  { label: 'Legal', href: '/legal' },
] as const;

interface SiteHeaderProps {
  username?: string;
}

export function SiteHeader({ username }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="wordmark" href="/">
          CreditCardMatch
        </Link>
        <nav aria-label="Primary navigation" className="primary-nav">
          <ComparisonLink />
          {navigationItems.map((item) => (
            <Link href={item.href} key={item.label}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="account-nav">
          {username ? (
            <>
              <span className="account-username">{username}</span>
              <form action={logoutAction}>
                <button className="header-link-button" type="submit">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}
