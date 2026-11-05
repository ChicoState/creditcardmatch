import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CurrentCardsPage from '../../app/account/current-cards/page';

vi.mock('../../lib/account/data', () => ({
  getAccountDashboardData: vi.fn().mockResolvedValue({
    username: 'alex',
    roster: [],
    availableCards: [],
    rewardCategories: [],
    spend: [],
  }),
}));

vi.mock('../../components/account-roster', () => ({
  AccountRoster: () => <div>roster</div>,
}));

describe('CurrentCardsPage', () => {
  it('renders the current cards page header above the roster', async () => {
    render(await CurrentCardsPage());

    expect(screen.getByText('roster')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Current Cards' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Account details' }),
    ).not.toBeInTheDocument();
  });
});
