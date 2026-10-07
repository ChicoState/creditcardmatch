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
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
