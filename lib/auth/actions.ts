'use server';

import { redirect } from 'next/navigation';

import { consumeAuthRateLimit } from './rate-limit';
import { createAuthAdminClient, createAuthServerClient } from './server';
import type { AuthActionState } from './types';
import {
  encodeUsernameAsEmail,
  validateSignupPassword,
  validateUsername,
  type AuthFieldErrors,
} from './validation';

function formValues(formData: FormData): {
  username: string;
  password: string;
} {
  return {
    username:
      typeof formData.get('username') === 'string'
        ? String(formData.get('username'))
        : '',
    password:
      typeof formData.get('password') === 'string'
        ? String(formData.get('password'))
        : '',
  };
}

function duplicateUsername(error: {
  code?: string;
  message?: string;
}): boolean {
  return (
    error.code === 'email_exists' ||
    error.code === 'user_already_exists' ||
    /already registered|already exists/iu.test(error.message ?? '')
  );
}

export async function signupAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const { username, password } = formValues(formData);
  if (!(await consumeAuthRateLimit('signup'))) {
    return {
      username,
      fieldErrors: {},
      formError: 'Too many attempts. Try again later.',
    };
  }

  const fieldErrors: AuthFieldErrors = {};
  const usernameError = validateUsername(username);
  const passwordError = validateSignupPassword(password);
  if (usernameError) fieldErrors.username = usernameError;
  if (passwordError) fieldErrors.password = passwordError;
  if (Object.keys(fieldErrors).length > 0) return { username, fieldErrors };

  const email = encodeUsernameAsEmail(username);
  const { error: createError } =
    await createAuthAdminClient().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });

  if (createError) {
    if (duplicateUsername(createError)) {
      return { username, fieldErrors: { username: 'Username already taken.' } };
    }

    return {
      username,
      fieldErrors: {},
      formError: 'We could not create your account. Try again later.',
    };
  }

  const auth = await createAuthServerClient();
  const { error: signInError } = await auth.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    return {
      username,
      fieldErrors: {},
      formError: 'Your account was created. Please login to continue.',
    };
  }

  redirect('/');
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const { username, password } = formValues(formData);
  if (!(await consumeAuthRateLimit('login'))) {
    return {
      username,
      fieldErrors: {},
      formError: 'Too many attempts. Try again later.',
    };
  }

  const usernameError = validateUsername(username);
  if (usernameError)
    return { username, fieldErrors: { username: usernameError } };

  const auth = await createAuthServerClient();
  const { error } = await auth.auth.signInWithPassword({
    email: encodeUsernameAsEmail(username),
    password,
  });
  if (error) {
    return {
      username,
      fieldErrors: {},
      formError: 'Invalid username or password.',
    };
  }

  redirect('/');
}

export async function logoutAction(): Promise<void> {
  const auth = await createAuthServerClient();
  await auth.auth.signOut();
  redirect('/');
}
