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
  it('shows account values and saves an edited display name', async () => {
    vi.mocked(saveAccountDetails).mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<AccountDetails name="Original" email="" />);
    expect(screen.getByText('No email added')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Change name' }));
    const input = screen.getByLabelText('New account name');
    await user.clear(input);
    await user.type(input, 'New name');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Account name saved.')).toBeVisible();
    expect(vi.mocked(saveAccountDetails).mock.calls[0][0].get('value')).toBe(
      'New name',
    );
  });
  it('discards drafts on cancel', async () => {
    const user = userEvent.setup();
    render(<AccountDetails name="Original" email="" />);
    await user.click(screen.getByRole('button', { name: 'Change name' }));
    await user.type(screen.getByLabelText('New account name'), ' draft');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Change name' }));
    expect(screen.getByLabelText('New account name')).toHaveValue('Original');
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
    render(<AccountDetails name="Original" email="" />);
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
    render(<AccountDetails name="Original" email="" />);
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
