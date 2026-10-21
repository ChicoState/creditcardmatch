'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { loginAction, signupAction } from '../lib/auth/actions';
import { EMPTY_AUTH_STATE, type AuthActionState } from '../lib/auth/types';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const action = mode === 'login' ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState<
    AuthActionState,
    FormData
  >(action, EMPTY_AUTH_STATE);
  const isSignup = mode === 'signup';

  return (
    <form action={formAction} className="auth-form">
      <div className="auth-form__field">
        <label htmlFor="username">Username</label>
        <input
          aria-describedby={
            state.fieldErrors.username ? 'username-error' : undefined
          }
          aria-invalid={Boolean(state.fieldErrors.username)}
          autoComplete="username"
          defaultValue={state.username}
          id="username"
          name="username"
          required
          type="text"
        />
        {state.fieldErrors.username ? (
          <p className="form-error" id="username-error" role="alert">
            {state.fieldErrors.username}
          </p>
        ) : null}
      </div>

      <div className="auth-form__field">
        <label htmlFor="password">Password</label>
        <input
          aria-describedby={
            isSignup
              ? 'password-help'
              : state.fieldErrors.password
                ? 'password-error'
                : undefined
          }
          aria-invalid={Boolean(state.fieldErrors.password)}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          id="password"
          name="password"
          required
          type="password"
        />
        {isSignup ? (
          <p id="password-help">At least 8 characters and one digit.</p>
        ) : null}
        {state.fieldErrors.password ? (
          <p className="form-error" id="password-error" role="alert">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      {state.formError ? (
        <p className="form-error" role="alert">
          {state.formError}
        </p>
      ) : null}

      <button
        className="primary-action auth-form__submit"
        disabled={pending}
        type="submit"
      >
        {pending ? 'Please wait…' : isSignup ? 'Create account' : 'Login'}
      </button>

      <Link
        className="text-link auth-form__link"
        href={isSignup ? '/login' : '/signup'}
      >
        {isSignup ? 'Already have an account? Login' : 'Sign up'}
      </Link>
    </form>
  );
}
