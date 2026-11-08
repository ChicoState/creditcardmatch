import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));

vi.mock('../../lib/data/catalog', async () => {
  const { catalogFixture } = await import('../fixtures/catalog');

  return {
    getCatalogData: vi.fn(async () => catalogFixture),
  };
});

import LearnPage from '../../app/learn/page';
import HomePage from '../../app/page';
import ResultsPage from '../../app/results/page';
import { ComparisonProvider } from '../../components/comparison-provider';
import { SiteHeader } from '../../components/site-header';

describe('credit card FAQ', () => {
  afterEach(cleanup);

  it('offers an introductory, source-linked credit-card reference', async () => {
    render(<LearnPage />);

    expect(
      await screen.findByRole('heading', { name: 'Credit card basics' }),
    ).toBeVisible();
    expect(
      await screen.findByRole('table', { name: 'Credit card pros and cons' }),
    ).toBeVisible();
    expect(await screen.findByText('APR', { selector: 'dt' })).toBeVisible();
    expect(
      await screen.findByText('Hard credit check', { selector: 'dt' }),
    ).toBeVisible();
    expect(
      await screen.findByText('Soft credit check', { selector: 'dt' }),
    ).toBeVisible();
    expect(
      await screen.findByText(
        'What is the difference between a credit card and a debit card?',
        { selector: 'summary' },
      ),
    ).toBeVisible();
    expect(
      await screen.findByText('Will checking my credit hurt my credit score?', {
        selector: 'summary',
      }),
    ).toBeVisible();
    expect(
      await screen.findByText(/educational information, not financial advice/i),
    ).toBeVisible();
    expect(
      await screen.findByRole('link', {
        name: /consumer financial protection bureau/i,
      }),
    ).toHaveAttribute('href', expect.stringContaining('consumerfinance.gov'));
    expect(screen.queryByText(/AI-generated/i)).not.toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: /Read the legal information/i }),
    ).toHaveAttribute('href', '/legal');
  });

  it('is linked from the home page, recommendations, and global navigation', async () => {
    const { unmount } = render(await HomePage());
    expect(
      await screen.findByRole('link', { name: /Credit card FAQ/i }),
    ).toHaveAttribute('href', '/learn');
    unmount();

    const { unmount: unmountResults } = render(
      await ResultsPage({
        searchParams: Promise.resolve({}),
      }),
      { wrapper: ComparisonProvider },
    );
    expect(
      await screen.findByRole('link', { name: 'Learn credit card basics' }),
    ).toHaveAttribute('href', '/learn');
    unmountResults();

    render(<SiteHeader />);
    expect(
      await screen.findByRole('link', { name: 'Credit Card FAQ' }),
    ).toHaveAttribute('href', '/learn');
  });
});
