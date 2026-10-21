import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { SiteHeader } from '../components/site-header';
import { getCurrentUsername } from '../lib/auth/server';
import './globals.css';

export const metadata: Metadata = {
  title: 'CreditCardMatch',
  description: 'Find fictional card matches based on what matters to you.',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const username = await getCurrentUsername();

  return (
    <html lang="en">
      <body>
        <SiteHeader username={username} />
        {children}
      </body>
    </html>
  );
}
