import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';

import './globals.css';

export const metadata: Metadata = {
  title: 'CreditCardMatch',
  description: 'Find fictional card matches based on what matters to you.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="site-header__content">
            <Link className="site-title" href="/">
              Credit Card Match
            </Link>
            <nav aria-label="Primary navigation" className="site-navigation">
              <Link href="/learn">Credit card FAQ</Link>
              <button className="login-button" disabled type="button">
                Login
              </button>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
