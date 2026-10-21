import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SiteHeader } from '../../components/site-header';

describe('SiteHeader', () => {
  afterEach(cleanup);

  it('shows navigation and login without the removed help artifact', () => {
    render(<SiteHeader />);

    expect(
      screen.getByRole('link', { name: 'Credit card FAQ' }),
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
});
