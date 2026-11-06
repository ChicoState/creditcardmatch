import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AccountPage from '../../app/account/page';

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), redirect: vi.fn() }));
vi.mock('../../lib/auth/server', () => ({
  createAuthServerClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock('../../lib/account/actions', () => ({ saveAccountDetails: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe('account page', () => {
  afterEach(cleanup);
  beforeEach(() => {
    mocks.redirect.mockImplementation(() => {
      throw new Error('redirect');
    });
  });
  it('redirects guests to login', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    await expect(AccountPage()).rejects.toThrow('redirect');
    expect(mocks.redirect).toHaveBeenCalledWith('/login');
  });
  it('renders saved name and contact email without exposing internal auth email', async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'owner',
          email: 'internal@accounts.invalid',
          user_metadata: {
            username: 'login',
            display_name: 'Display name',
            contact_email: 'contact@example.com',
          },
        },
      },
    });
    render(await AccountPage());
    const username = screen.getByRole('region', { name: 'Username' });
    expect(username).toHaveTextContent('login');
    expect(username.querySelector('button')).toHaveTextContent(
      'Change username',
    );
    expect(
      screen
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(['Username', 'Password', 'Contact email', 'Profile photo']);
    expect(screen.queryByText('Display name')).toBeNull();
    expect(screen.getByText('contact@example.com')).toBeVisible();
    expect(
      screen.queryByText('internal@accounts.invalid'),
    ).not.toBeInTheDocument();
  });
  it('uses username, no email, and default photo for older accounts', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'owner', user_metadata: { username: 'login' } } },
    });
    render(await AccountPage());
    expect(screen.getAllByText('login')).toHaveLength(1);
    expect(screen.getByText('No email added')).toBeVisible();
    expect(
      screen.getByRole('img', { name: 'Default profile photo' }),
    ).toBeVisible();
  });
});
