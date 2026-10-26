import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AuthForm } from '../../components/auth-form';

describe('AuthForm', () => {
  afterEach(cleanup);

  it('renders the signup contract accessibly', () => {
    render(<AuthForm mode="signup" />);

    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.getByLabelText('Username')).toBeRequired();
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'autocomplete',
      'new-password',
    );
    expect(
      screen.getByText('At least 8 characters and one digit.'),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Create account' }),
    ).toBeEnabled();
    expect(
      screen.getByRole('link', { name: 'Already have an account? Login' }),
    ).toHaveAttribute('href', '/login');
  });

  it('renders login with the signup link and no signup requirements', () => {
    render(<AuthForm mode="login" />);

    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'autocomplete',
      'current-password',
    );
    expect(
      screen.queryByText('At least 8 characters and one digit.'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute(
      'href',
      '/signup',
    );
  });
});
