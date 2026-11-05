import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountDetails } from '../../components/account-details';
import { saveAccountDetails } from '../../lib/account/actions';

vi.mock('../../lib/account/actions', () => ({ saveAccountDetails: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe('account editors', () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.mocked(saveAccountDetails).mockReset();
  });
  it('shows only the login username and changes password', async () => {
    vi.mocked(saveAccountDetails).mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<AccountDetails username="login" email="" />);
    expect(screen.getAllByText('login')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Change name' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Change password' }));
    await user.type(screen.getByLabelText('Current password'), 'oldpass1');
    await user.type(screen.getByLabelText('New password'), 'newpass2');
    await user.type(screen.getByLabelText('Confirm new password'), 'newpass2');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Password saved.')).toBeVisible();
    expect(screen.queryByLabelText('Current password')).toBeNull();
    expect(vi.mocked(saveAccountDetails).mock.calls[0][0].get('password')).toBe(
      'newpass2',
    );
  });
  it('saves a changed login username', async () => {
    vi.mocked(saveAccountDetails).mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<AccountDetails username="login" email="" />);
    await user.click(screen.getByRole('button', { name: 'Change username' }));
    await user.clear(screen.getByLabelText('New username'));
    await user.type(screen.getByLabelText('New username'), 'new_login');
    await user.type(screen.getByLabelText('Current password'), 'oldpass1');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Username saved.')).toBeVisible();
    expect(vi.mocked(saveAccountDetails).mock.calls[0][0].get('value')).toBe(
      'new_login',
    );
  });
  it('clears password drafts on cancel', async () => {
    const user = userEvent.setup();
    render(<AccountDetails username="login" email="" />);
    await user.click(screen.getByRole('button', { name: 'Change password' }));
    await user.type(screen.getByLabelText('New password'), 'draft123');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Change password' }));
    expect(screen.getByLabelText('New password')).toHaveValue('');
    expect(saveAccountDetails).not.toHaveBeenCalled();
  });
  it('keeps input after failures and prevents duplicate saves while pending', async () => {
    let finish!: (result: { error: string }) => void;
    vi.mocked(saveAccountDetails).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<AccountDetails username="login" email="" />);
    await user.click(screen.getByRole('button', { name: 'Change email' }));
    await user.type(
      screen.getByLabelText('New contact email'),
      'me@example.com',
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    finish({ error: 'Please log in again.' });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please log in again.',
    );
    expect(screen.getByLabelText('New contact email')).toHaveValue(
      'me@example.com',
    );
  });
  it('rejects invalid files before upload', async () => {
    render(<AccountDetails username="login" email="" />);
    fireEvent.click(screen.getByRole('button', { name: 'Change photo' }));
    fireEvent.change(screen.getByLabelText('Choose a photo'), {
      target: {
        files: [new File(['bad'], 'bad.svg', { type: 'image/svg+xml' })],
      },
    });
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('JPEG'),
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});
