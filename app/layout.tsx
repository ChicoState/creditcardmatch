import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ComparisonProvider } from '../components/comparison-provider';
import { ComparisonLink } from '../components/comparison-cart';

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
        <ComparisonProvider>
          <header className="site-header">
            <div className="site-header__content">
              <Link className="site-title" href="/">
                Credit Card Match
              </Link>
              <nav aria-label="Primary navigation" className="site-navigation">
                <ComparisonLink />
                <Link href="/learn">Credit card FAQ</Link>
                <Link href="/legal">Legal</Link>
                <button className="login-button" disabled type="button">
                  Login
                </button>
              </nav>
            </div>
          </header>
          {children}
        </ComparisonProvider>
      </body>
    </html>
  );
}