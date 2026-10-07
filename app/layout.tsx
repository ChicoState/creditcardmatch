import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { SiteHeader } from '../components/site-header';

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
            <span className="site-title">
              Credit Card Match
            </span>
            <button className="login-button" disabled type="button">Login</button>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
