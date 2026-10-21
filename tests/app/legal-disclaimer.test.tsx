import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/data/catalog', async () => {
  const { catalogFixture } = await import('../fixtures/catalog');

  return {
    getCatalogData: vi.fn(async () => catalogFixture),
  };
});

import RootLayout from '../../app/layout';
import LegalPage from '../../app/legal/page';
import HomePage from '../../app/page';
import ResultsPage from '../../app/results/page';

describe('legal page', () => {
  it('explains site boundaries and common credit-card risks', () => {
    render(<LegalPage />);

    expect(
      screen.getByRole('heading', {
        name: 'Before you use a credit card',
      }),
    ).toBeVisible();
    expect(screen.getByText(/independent, informational tool/i)).toBeVisible();
    expect(
      screen.getByText(/does not provide legal, financial, tax/i),
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
    expect(screen.getByText(/wage garnishment/i)).toBeVisible();
    expect(screen.getByText(/bankruptcy/i)).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'A safer way to compare' }),
    ).toBeVisible();
    expect(
      screen.getByRole('link', {
        name: /consumer financial protection bureau/i,
      }),
    ).toHaveAttribute('href', expect.stringContaining('consumerfinance.gov'));
    expect(
      screen.getByRole('link', { name: /FTC debt collection guidance/i }),
    ).toHaveAttribute('href', expect.stringContaining('consumer.ftc.gov'));
  });

  it('is linked prominently without requiring an acknowledgment', async () => {
    const { unmount: unmountHome } = render(await HomePage());
    expect(screen.getByRole('link', { name: 'Legal' })).toHaveAttribute(
      'href',
      '/legal',
    );

    unmountHome();
    const { unmount } = render(
      await ResultsPage({ searchParams: Promise.resolve({}) }),
    );
    expect(
      screen.getByRole('link', { name: /read the legal page/i }),
    ).toHaveAttribute('href', '/legal');
    unmount();

    render(RootLayout({ children: 'Content' }));
    expect(screen.getByRole('link', { name: 'Legal' })).toHaveAttribute(
      'href',
      '/legal',
    );
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
