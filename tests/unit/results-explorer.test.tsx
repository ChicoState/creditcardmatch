import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { ResultsExplorer } from '../../components/results-explorer';
import { selectVisibleCatalogCards } from '../../lib/catalog/visibility';
import { catalogFixture } from '../fixtures/catalog';

afterEach(cleanup);

describe('ResultsExplorer card details', () => {
  it('shows confirmed fees, secured deposit, and no-rewards status compactly', () => {
    render(
      <ResultsExplorer
        activeFilters={[]}
        cards={selectVisibleCatalogCards(catalogFixture)}
        filters={catalogFixture.filters}
      />,
    );

    const card = screen
      .getByRole('heading', { name: 'Harbor Starter Card' })
      .closest('article');
    expect(card).not.toBeNull();
    const details = within(card as HTMLElement);

    expect(details.getByText('$0 first year')).toBeVisible();
    expect(details.getByText('$25')).toBeVisible();
    expect(details.getByText('$5')).toBeVisible();
    expect(details.getByText('Secured · $49 minimum deposit')).toBeVisible();
    expect(details.getByText('No rewards')).toBeVisible();
    expect(details.getByText('Mastercard')).toBeVisible();
  });

  it('hides zero and unconfirmed one-time or monthly fees', () => {
    render(
      <ResultsExplorer
        activeFilters={[]}
        cards={selectVisibleCatalogCards(catalogFixture)}
        filters={catalogFixture.filters}
      />,
    );

    const card = screen
      .getByRole('heading', { name: 'Aurora Everyday Card' })
      .closest('article');
    expect(card).not.toBeNull();
    const details = within(card as HTMLElement);

    expect(details.queryByText('One-time fee')).not.toBeInTheDocument();
    expect(details.queryByText('Monthly fee')).not.toBeInTheDocument();
    expect(details.queryByText(/^Secured/)).not.toBeInTheDocument();
    expect(details.queryByText('No rewards')).not.toBeInTheDocument();
  });
});
