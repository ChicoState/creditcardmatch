import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SurveyForm } from '../../components/survey-form';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

async function completeRequiredSteps(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText('$40,001–$60,000'));
  await user.click(screen.getByRole('button', { name: 'Next question' }));
  await user.click(screen.getByLabelText('Building/no score yet'));
  await user.click(screen.getByRole('button', { name: 'Next question' }));
  await user.click(screen.getByLabelText('Cash back'));
  await user.click(screen.getByRole('button', { name: 'Next question' }));
  await user.click(screen.getByLabelText('Groceries'));
  await user.click(screen.getByRole('button', { name: 'Next question' }));
  await user.click(screen.getByRole('button', { name: 'Next question' }));
  await user.click(screen.getByLabelText('No'));
  await user.click(screen.getByRole('button', { name: 'Next question' }));
}

describe('SurveyForm', () => {
  afterEach(cleanup);

  beforeEach(() => {
    push.mockReset();
  });

  it('shows one question at a time and preserves an answer when moving back', async () => {
    const user = userEvent.setup();

    render(<SurveyForm />);

    expect(screen.getByText('Question 1 of 7')).toBeVisible();
    expect(
      screen.getByLabelText('$40,001–$60,000').closest('label'),
    ).toHaveClass('choice-row');
    expect(
      screen.queryByText('What is your credit score range?'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Next question' }),
    ).toBeDisabled();

    await user.click(screen.getByLabelText('$40,001–$60,000'));
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.click(screen.getByRole('button', { name: 'Previous question' }));

    expect(screen.getByLabelText('$40,001–$60,000')).toBeChecked();
  });

  it('limits category priorities, keeps optional spend local, and redirects with live filters', async () => {
    const user = userEvent.setup();

    render(<SurveyForm />);
    await user.click(screen.getByLabelText('$40,001–$60,000'));
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.click(screen.getByLabelText('Building/no score yet'));
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.click(screen.getByLabelText('Cash back'));
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.click(screen.getByLabelText('Groceries'));
    await user.click(screen.getByLabelText('Gas'));
    await user.click(screen.getByLabelText('Travel'));

    expect(screen.getByLabelText('Shopping')).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.type(screen.getByLabelText('Groceries'), '425.50');
    await user.type(screen.getByLabelText('Gas'), '95');
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.click(screen.getByLabelText('No'));
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.click(screen.getByLabelText('None in particular'));
    await user.click(screen.getByRole('button', { name: 'Review answers' }));

    expect(
      screen.getByRole('heading', { name: 'Review your answers' }),
    ).toBeVisible();
    expect(screen.getByText('Groceries: $425.5, Gas: $95')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'SEE MY MATCHES' }));

    expect(push).toHaveBeenCalledWith(
      '/results?filters=new-to-credit,cashback',
    );
  });

  it('makes “None in particular” exclusive from other benefits', async () => {
    const user = userEvent.setup();

    render(<SurveyForm />);
    await completeRequiredSteps(user);
    await user.click(screen.getByLabelText('Purchase protection'));
    await user.click(screen.getByLabelText('None in particular'));

    expect(screen.getByLabelText('Purchase protection')).not.toBeChecked();
    expect(screen.getByLabelText('None in particular')).toBeChecked();
  });
});
