import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AccountPage from '../../app/account/page';

vi.mock('../../lib/account/data', () => ({
  getAccountDashboardData: vi.fn().mockResolvedValue({
    username: 'alex',
    roster: [],
    availableCards: [],
    spend: [],
  }),
}));

vi.mock('../../components/account-roster', () => ({
  AccountRoster: () => null,
}));

describe('AccountPage', () => {
  it('displays the username instead of an email address', async () => {
    render(await AccountPage());

    expect(
      screen.getByRole('heading', { name: 'Username' }),
    ).toBeInTheDocument();
    expect(screen.getByText('alex', { exact: true })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Email' }),
    ).not.toBeInTheDocument();
  });
});
