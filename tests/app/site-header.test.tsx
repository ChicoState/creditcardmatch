import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

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

  it('keeps Compare, Credit Card FAQ, and Legal in navigation order', () => {
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
    ).toEqual(['Compare 0', 'Credit Card FAQ', 'Legal']);
  });
});
