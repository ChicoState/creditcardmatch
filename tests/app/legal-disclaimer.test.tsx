import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/data/catalog', async () => {
  const { catalogFixture } = await import('../fixtures/catalog');

  return {
    getCatalogData: vi.fn(async () => catalogFixture),
  };
});

import RootLayout from '../../app/layout';
import LegalPage from '../../app/legal/page';
import HomePage from '../../app/page';

describe('legal page', () => {
  afterEach(cleanup);

  it('explains site boundaries and common credit-card risks', () => {
    render(<LegalPage />);

    expect(
      screen.getByRole('heading', {
        name: 'Before you use a credit card',
      }),
    ).toBeVisible();
    expect(screen.getByText(/independent, informational tool/i)).toBeVisible();
    expect(
      screen.getByText(/Nothing here is legal, financial, tax/i),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'The costs can add up' }),
    ).toBeVisible();
    expect(screen.getByText(/minimum payment/i)).toBeVisible();
    expect(screen.getByText(/cash advances/i)).toBeVisible();
    expect(
      screen.getByRole('heading', {
        name: 'When debt becomes a legal problem',
      }),
    ).toBeVisible();
    expect(screen.getByText(/wage garnishment is not automatic/i)).toBeVisible();
    expect(
      screen.getByText(/bankruptcy can have lasting consequences/i),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'A safer way to compare' }),
    ).toBeVisible();
    expect(
      screen.getByRole('link', {
        name: /Read CFPB interest guidance/i,
      }),
    ).toHaveAttribute('href', expect.stringContaining('consumerfinance.gov'));
    expect(
      screen.getByRole('link', { name: /FTC debt-collection FAQs/i }),
    ).toHaveAttribute('href', expect.stringContaining('consumer.ftc.gov'));
  });

  it('is linked from home and global navigation without requiring an acknowledgment', async () => {
    const { unmount: unmountHome } = render(await HomePage());
    expect(screen.getByRole('link', { name: 'Legal' })).toHaveAttribute(
      'href',
      '/legal',
    );

    unmountHome();

    render(await RootLayout({ children: 'Content' }));
    expect(screen.getByRole('link', { name: 'Legal' })).toHaveAttribute(
      'href',
      '/legal',
    );
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
