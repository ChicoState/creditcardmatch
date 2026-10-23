import type { AuthFieldErrors } from './validation';

export interface AuthActionState {
  username: string;
  fieldErrors: AuthFieldErrors;
  formError?: string;
}

export const EMPTY_AUTH_STATE: AuthActionState = {
  username: '',
  fieldErrors: {},
};
