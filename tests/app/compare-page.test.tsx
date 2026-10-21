import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/data/catalog', async () => {
  const { catalogFixture } = await import('../fixtures/catalog');
  return { getCatalogData: vi.fn(async () => catalogFixture) };
});

import ComparePage from '../../app/compare/page';
import { ComparisonView } from '../../components/comparison-view';
import { ComparisonProvider } from '../../components/comparison-provider';
import { selectComparisonCards } from '../../lib/catalog/comparison';
import { COMPARISON_STORAGE_KEY } from '../../lib/storage/comparison-storage';
import { catalogFixture } from '../fixtures/catalog';

beforeEach(() => sessionStorage.clear());
afterEach(cleanup);

describe('compare page', () => {
  it('helps visitors with an empty cart return to the catalog', async () => {
    render(await ComparePage(), { wrapper: ComparisonProvider });
    expect(
      screen.getByRole('heading', { name: 'Compare cards' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', {
        name: 'Start with a card that interests you.',
      }),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Browse all cards' }),
    ).toHaveAttribute('href', '/results');
  });

  it('compares CSV-backed descriptions, benefits, unknown and zero fees, and removes cards', async () => {
    sessionStorage.setItem(COMPARISON_STORAGE_KEY, '[10,11]');
    const user = userEvent.setup();
    render(await ComparePage(), { wrapper: ComparisonProvider });
    const table = screen.getByRole('table', { name: 'Card comparison' });
    expect(
      within(table).getByText('A fictional starter card for unit tests.'),
    ).toBeVisible();
    expect(within(table).getByText('First benefit')).toBeVisible();
    expect(within(table).getByText('Unverified')).toBeVisible();
    const foreignFee = within(table).getByRole('row', {
      name: /Foreign transaction fee/,
    });
    expect(within(foreignFee).getByText('Not listed')).toBeVisible();
    expect(within(foreignFee).getByText('0%')).toBeVisible();
    const rewards = within(table).getByRole('row', { name: /^Other / });
    expect(within(rewards).getByText('1% cash back')).toBeVisible();
    expect(within(rewards).getByText('No rewards')).toBeVisible();
    expect(
      within(table).getByText('$0 first year; $0/year after'),
    ).toBeVisible();
    await user.click(
      within(table).getByRole('button', { name: 'Remove Harbor Starter Card' }),
    );
    expect(
      screen.getByText('Add another card to see the differences side by side.'),
    ).toBeVisible();
    expect(
      within(table).queryByText('Harbor Starter Card'),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear comparison' }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('keeps point and mile units, caps, post-cap rates and notes together', () => {
    sessionStorage.setItem(COMPARISON_STORAGE_KEY, '[10,11]');
    const cards = selectComparisonCards(catalogFixture);
    cards[0] = {
      ...cards[1],
      cardId: 10,
      cardName: 'Points card',
      rewardType: 'points',
      rewards: [
        {
          ...cards[1].rewards[0],
          rate: 3,
          spendCap: 1500,
          capPeriod: 'quarter',
          rateAfterCap: 1,
          notes: 'Enrollment required',
        },
      ],
    };
    cards[1] = { ...cards[1], rewardType: 'miles' };
    render(<ComparisonView cards={cards} />, { wrapper: ComparisonProvider });
    expect(screen.getByText('3 points per $1')).toBeVisible();
    expect(
      screen.getByText('On up to $1,500 in spending per quarter.'),
    ).toBeVisible();
    expect(screen.getByText('Then 1 point per $1.')).toBeVisible();
    expect(screen.getByText('Enrollment required')).toBeVisible();
    expect(screen.getByText('1 mile per $1')).toBeVisible();
  });
});
