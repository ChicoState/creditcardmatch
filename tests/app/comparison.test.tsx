import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { ComparisonProvider } from '../../components/comparison-provider';
import { ComparisonCart } from '../../components/comparison-cart';
import { ResultsExplorer } from '../../components/results-explorer';
import { selectVisibleCatalogCards } from '../../lib/catalog/visibility';
import { COMPARISON_STORAGE_KEY } from '../../lib/storage/comparison-storage';
import { catalogFixture } from '../fixtures/catalog';

beforeEach(() => sessionStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const cards = selectVisibleCatalogCards(catalogFixture);

function Catalog() {
  return (
    <ComparisonProvider>
      <ResultsExplorer
        cards={cards}
        filters={catalogFixture.filters}
        activeFilters={[]}
      />
    </ComparisonProvider>
  );
}

describe('comparison cart', () => {
  it('adds cards, preserves selection through search, links to compare and removes', async () => {
    const user = userEvent.setup();
    render(<Catalog />);
    await user.click(
      screen.getByRole('button', {
        name: 'Add to compare: Aurora Everyday Card',
      }),
    );
    const cart = screen.getByRole('region', { name: 'Comparison cart' });
    expect(within(cart).getByText('Aurora Everyday Card')).toBeVisible();
    expect(
      within(cart).getByRole('link', { name: /Compare cards \(1\/4\)/ }),
    ).toHaveAttribute('href', '/compare');
    await user.type(screen.getByRole('searchbox'), 'Harbor');
    expect(within(cart).getByText('Aurora Everyday Card')).toBeVisible();
    expect(JSON.parse(sessionStorage.getItem(COMPARISON_STORAGE_KEY)!)).toEqual(
      [11],
    );
    await user.click(
      within(cart).getByRole('button', {
        name: 'Remove Aurora Everyday Card from comparison',
      }),
    );
    expect(
      within(cart).getByRole('link', { name: /Compare cards \(0\/4\)/ }),
    ).toBeVisible();
  });

  it('restores active selections in order and explains unavailable cards', async () => {
    sessionStorage.setItem(COMPARISON_STORAGE_KEY, '[11,12,10,999]');
    render(<Catalog />);
    const cart = screen.getByRole('region', { name: 'Comparison cart' });
    expect(
      await within(cart).findByText(
        'Some selected cards are no longer available and were removed.',
      ),
    ).toBeVisible();
    expect(
      within(cart)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      expect.stringContaining('Aurora Everyday Card'),
      expect.stringContaining('Harbor Starter Card'),
    ]);
    expect(JSON.parse(sessionStorage.getItem(COMPARISON_STORAGE_KEY)!)).toEqual(
      [11, 10],
    );
  });

  it('enforces four cards but allows removal and clearing', async () => {
    const user = userEvent.setup();
    const fiveCards = Array.from({ length: 5 }, (_, i) => ({
      ...cards[0],
      cardId: i + 1,
      cardName: `Card ${i + 1}`,
    }));
    render(
      <ComparisonProvider>
        <ResultsExplorer cards={fiveCards} filters={[]} activeFilters={[]} />
      </ComparisonProvider>,
    );
    for (let i = 1; i <= 4; i++)
      await user.click(
        screen.getByRole('button', { name: `Add to compare: Card ${i}` }),
      );
    expect(
      screen.getByRole('button', { name: 'Add to compare: Card 5' }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        'Your comparison is full. Remove a card to add another.',
      ),
    ).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'Remove from comparison: Card 1' }),
    );
    expect(
      screen.getByRole('button', { name: 'Add to compare: Card 5' }),
    ).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Clear comparison' }));
    expect(
      screen.getByRole('link', { name: /Compare cards \(0\/4\)/ }),
    ).toBeVisible();
  });

  it('works in memory when session storage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota');
    });
    const user = userEvent.setup();
    render(<Catalog />);
    await user.click(
      screen.getByRole('button', {
        name: 'Add to compare: Aurora Everyday Card',
      }),
    );
    expect(
      screen.getByRole('link', { name: /Compare cards \(1\/4\)/ }),
    ).toBeVisible();
  });

  it('handles malformed storage without breaking the cart', () => {
    sessionStorage.setItem(COMPARISON_STORAGE_KEY, 'broken');
    render(
      <ComparisonProvider>
        <ComparisonCart cards={cards} />
      </ComparisonProvider>,
    );
    expect(
      screen.getByRole('link', { name: /Compare cards \(0\/4\)/ }),
    ).toBeVisible();
  });
});
