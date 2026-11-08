import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AccountRoster } from '../../components/account-roster';
import type { CatalogCard } from '../../lib/catalog/types';

const { addCardAction, saveCardRosterAction, removeCardAction } = vi.hoisted(
  () => ({
    addCardAction: vi.fn().mockResolvedValue(undefined),
    saveCardRosterAction: vi.fn().mockResolvedValue(undefined),
    removeCardAction: vi.fn().mockResolvedValue(undefined),
  }),
);

vi.mock('../../lib/account/actions', () => ({
  addCardAction,
  saveCardRosterAction,
  removeCardAction,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const card = (cardId: number, cardName: string): CatalogCard => ({
  cardId,
  slug: cardName.toLowerCase().replaceAll(' ', '-'),
  issuer: 'Test issuer',
  cardName,
  network: null,
  pointValueCents: null,
  annualFee: 0,
  annualFeeWaivedFirstYear: false,
  oneTimeFee: null,
  monthlyFee: null,
  foreignTransactionFeePercent: null,
  isSecured: false,
  securityDepositMin: null,
  introOffer: null,
  applyUrl: null,
  imageUrl: null,
  description: null,
  rewardType: 'cashback',
  creditLevelRequired: null,
  isVerified: true,
  rewardCategories: [],
  benefits: [],
  filterSlugs: [],
});

describe('AccountRoster', () => {
  afterEach(() => {
    cleanup();
    addCardAction.mockClear();
    saveCardRosterAction.mockClear();
    removeCardAction.mockClear();
  });

  it('opens the catalog with current cards selected and saves the catalog order', async () => {
    const user = userEvent.setup();
    const current = card(1, 'Current Card');
    const other = card(2, 'Other Card');
    const third = card(3, 'Third Card');

    render(
      <AccountRoster
        initialRoster={[current]}
        availableCards={[third, current, other]}
      />,
    );

    expect(screen.getByText('Current Card')).toBeVisible();
    expect(screen.getByText('Cards you have')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Add a catalog card' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Browse card catalog' }),
    ).toBeVisible();
    expect(screen.queryByText('Other Card')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Browse card catalog' }),
    );
    expect(screen.getByRole('dialog', { name: 'Card catalog' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Current Card, selected' }),
    ).toBeVisible();

    await user.click(
      screen.getByRole('button', { name: 'Other Card, not selected' }),
    );
    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(saveCardRosterAction).toHaveBeenCalledWith(expect.any(FormData));
    const formData = saveCardRosterAction.mock.calls[0][0] as FormData;
    expect(formData.getAll('card_id')).toEqual(['1', '2']);
    expect(
      screen.queryByRole('dialog', { name: 'Card catalog' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('heading').map((heading) => heading.textContent),
    ).toContain('Current Card');
    expect(
      screen.getAllByRole('heading').map((heading) => heading.textContent),
    ).toContain('Other Card');
  });

  it('discards draft changes when the catalog is closed without Done', async () => {
    const user = userEvent.setup();
    const current = card(1, 'Current Card');
    const other = card(2, 'Other Card');

    render(
      <AccountRoster
        initialRoster={[current]}
        availableCards={[current, other]}
      />,
    );
    await user.click(
      screen.getByRole('button', { name: 'Browse card catalog' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Other Card, not selected' }),
    );
    await user.keyboard('{Escape}');

    expect(
      screen.queryByRole('dialog', { name: 'Card catalog' }),
    ).not.toBeInTheDocument();
    expect(saveCardRosterAction).not.toHaveBeenCalled();
    expect(screen.queryByText('Other Card')).not.toBeInTheDocument();
  });

  it('allows an empty roster and shows its empty state after Done', async () => {
    const user = userEvent.setup();
    const current = card(1, 'Current Card');

    render(
      <AccountRoster initialRoster={[current]} availableCards={[current]} />,
    );
    await user.click(
      screen.getByRole('button', { name: 'Browse card catalog' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Current Card, selected' }),
    );
    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(
      screen.getByRole('heading', { name: 'Your roster is empty' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Browse card catalog' }),
    ).toBeVisible();
  });

  it('removes a card immediately and offers undo', async () => {
    const user = userEvent.setup();
    const current = card(1, 'Current Card');

    render(<AccountRoster initialRoster={[current]} availableCards={[]} />);
    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(
      screen.queryByRole('heading', { name: 'Current Card' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Current Card removed.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Undo' }));

    expect(addCardAction).toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Current Card' })).toBeVisible();
  });
});
