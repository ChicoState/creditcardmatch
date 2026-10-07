import Link from 'next/link';

// TODO(TBD): Replace these labels and destinations when the team defines the
// three global navigation links.
const navigationItems = [
  { label: 'Navigation 1 (TBD)', href: '/' },
  { label: 'Navigation 2 (TBD)', href: '/' },
  { label: 'Navigation 3 (TBD)', href: '/' },
] as const;

// TODO(TBD): Define the help icon behavior.

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="wordmark" href="/">
          CreditCardMatch
        </Link>
        <nav aria-label="Primary navigation" className="primary-nav">
          {navigationItems.map((item) => (
            <Link href={item.href} key={item.label}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="account-nav">
          <button
            aria-label="Help (behavior to be decided)"
            className="help-button"
            disabled
            title="Help behavior is TBD"
            type="button"
          >
            (?)
          </button>
          <Link href="/login">Log in</Link>
        </div>
      </div>
    </header>
  );
}
