import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('../../lib/data/catalog', async () => {
  const { catalogFixture } = await import('../fixtures/catalog');

  return {
    getCatalogData: vi.fn(async () => catalogFixture),
  };
});

import RootLayout from '../../app/layout';
import LearnPage from '../../app/learn/page';
import HomePage from '../../app/page';
import ResultsPage from '../../app/results/page';

describe('credit card FAQ', () => {
  it('offers an introductory, source-linked credit-card reference', () => {
    render(<LearnPage />);

    expect(
      screen.getByRole('heading', { name: 'Credit card basics' }),
    ).toBeVisible();
    expect(
      screen.getByRole('table', { name: 'Credit card pros and cons' }),
    ).toBeVisible();
    expect(screen.getByText('APR', { selector: 'dt' })).toBeVisible();
    expect(
      screen.getByText(
        'What is the difference between a credit card and a debit card?',
        { selector: 'summary' },
      ),
    ).toBeVisible();
    expect(
      screen.getByText(/educational information, not financial advice/i),
    ).toBeVisible();
    expect(
      screen.getByRole('link', {
        name: /consumer financial protection bureau/i,
      }),
    ).toHaveAttribute('href', expect.stringContaining('consumerfinance.gov'));
    expect(screen.queryByText(/AI-generated/i)).not.toBeInTheDocument();
  });

  it('is linked from the home page, recommendations, and global navigation', async () => {
    const { unmount } = render(await HomePage());
    expect(
      screen.getByRole('link', { name: 'Credit card FAQ' }),
    ).toHaveAttribute('href', '/learn');
    unmount();

    render(
      await ResultsPage({
        searchParams: Promise.resolve({}),
      }),
    );
    expect(
      screen.getByRole('link', { name: 'Learn credit card basics' }),
    ).toHaveAttribute('href', '/learn');

    const layout = await RootLayout({ children: 'Content' });
    render(layout);
    expect(
      screen.getByRole('link', { name: 'Credit card FAQ' }),
    ).toHaveAttribute('href', '/learn');
  });
});
