import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  redirect: vi.fn(),
  push: vi.fn(),
}));

vi.mock('../../lib/auth/server', () => ({
  createAuthServerClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
  useRouter: () => ({ push: mocks.push }),
}));

import BookmarksPage from '../../app/bookmarks/page';
import LoginPage from '../../app/login/page';
import SignupPage from '../../app/signup/page';
import SurveyPage from '../../app/survey/page';

describe('uncovered app pages', () => {
  afterEach(cleanup);

  it('redirects guests to login from the bookmarks page', async () => {
    mocks.redirect.mockImplementation(() => {
      throw new Error('redirect');
    });
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    await expect(BookmarksPage()).rejects.toThrow('redirect');
    expect(mocks.redirect).toHaveBeenCalledWith('/login?next=%2Fbookmarks');
  });

  it('renders the login form for a guest', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    render(await LoginPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole('heading', { name: 'Login' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  it('renders the signup form for a guest', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    render(await SignupPage());

    expect(
      screen.getByRole('heading', { name: 'Create account' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Create account' }),
    ).toBeVisible();
  });

  it('renders the first survey question', () => {
    render(<SurveyPage />);

    expect(
      screen.getByRole('heading', { name: 'Tell us what matters to you' }),
    ).toBeVisible();
    expect(screen.getByText('Question 1 of 7')).toBeVisible();
  });
});
