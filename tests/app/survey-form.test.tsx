import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SurveyForm } from '../../components/survey-form';
import type { SurveySubmission } from '../../lib/config/survey';

const { push, saveSurveyAnswersAction } = vi.hoisted(() => ({
  push: vi.fn(),
  saveSurveyAnswersAction: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));
vi.mock('../../lib/account/actions', () => ({ saveSurveyAnswersAction }));

async function completeRequiredSteps(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText('$40,001–$60,000'));
  await user.click(screen.getByRole('button', { name: 'Next question' }));
  await user.click(screen.getByLabelText('Building/no score yet'));
  await user.click(screen.getByRole('button', { name: 'Next question' }));
  await user.click(screen.getByLabelText('Cash back'));
  await user.click(screen.getByRole('button', { name: 'Next question' }));
  await user.click(screen.getByLabelText('Groceries'));
  await user.click(screen.getByRole('button', { name: 'Next question' }));
  await user.type(screen.getByLabelText('Groceries'), '250');
  await user.click(screen.getByRole('button', { name: 'Next question' }));
  await user.click(screen.getByLabelText('No'));
  await user.click(screen.getByRole('button', { name: 'Next question' }));
}

describe('SurveyForm', () => {
  afterEach(cleanup);

  beforeEach(() => {
    push.mockReset();
    saveSurveyAnswersAction.mockReset();
    saveSurveyAnswersAction.mockResolvedValue({ ok: true });
  });

  it('opens a question hint and closes it when clicking elsewhere', async () => {
    const user = userEvent.setup();

    render(<SurveyForm />);

    const hint = screen.getByText(
      'An estimate is enough. This is collected for future matching.',
    );
    expect(hint).not.toBeVisible();

    await user.click(
      screen.getByLabelText('Explain: What is your annual income?'),
    );
    expect(hint).toBeVisible();

    await user.click(hint);
    expect(hint).toBeVisible();

    await user.click(screen.getByText('Question 1 of 7'));
    expect(hint).not.toBeVisible();

    await user.click(
      screen.getByLabelText('Explain: What is your annual income?'),
    );
    await user.click(screen.getByLabelText('$40,001–$60,000'));
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    expect(hint).not.toBeVisible();
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

  it('requires spend for selected categories and redirects to survey results', async () => {
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
    expect(
      screen.getByRole('button', { name: 'Next question' }),
    ).toBeDisabled();
    await user.type(screen.getByLabelText('Groceries'), '425.50');
    await user.type(screen.getByLabelText('Gas'), '95');
    await user.type(screen.getByLabelText('Travel'), '120');
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.click(screen.getByLabelText('No'));
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.click(screen.getByLabelText('None in particular'));
    await user.click(screen.getByRole('button', { name: 'Review answers' }));

    expect(
      screen.getByRole('heading', { name: 'Review your answers' }),
    ).toBeVisible();
    expect(
      screen.getByText('Groceries: $425.5, Gas: $95, Travel: $120'),
    ).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'SEE MY MATCHES' }));

    expect(push).toHaveBeenCalledWith(
      '/results?mode=survey&filters=no-credit-history,cashback,no-annual-fee',
    );
  });

  it('offers an explicit save choice while keeping unsaved results available', async () => {
    const user = userEvent.setup();
    render(<SurveyForm />);
    await completeRequiredSteps(user);
    await user.click(screen.getByLabelText('None in particular'));
    await user.click(screen.getByRole('button', { name: 'Review answers' }));

    expect(screen.getByRole('button', { name: 'SAVE ANSWERS' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'SEE MY MATCHES' }),
    ).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'SAVE ANSWERS' }));
    expect(saveSurveyAnswersAction).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(
      '/results?mode=survey&filters=no-credit-history,cashback,no-annual-fee&saved=1',
    );
  });

  it('lets returning users choose saved answers or a new survey', async () => {
    const user = userEvent.setup();
    const saved = {
      accepts_annual_fee: false,
      card_filter_preferences: [],
      category_monthly_spend: [],
      credit_score_band: 'good',
      extra_benefit_slugs: [],
      income_range: '40001_to_60000',
      primary_goal: 'travel_rewards',
      priority_category_slugs: ['groceries'],
      user_filter_preferences: [],
      user_preferences: {
        accepts_annual_fee: false,
        wants_travel_rewards: true,
      },
    } as SurveySubmission;

    render(<SurveyForm savedSubmission={saved} />);
    expect(
      screen.getByRole('heading', { name: 'Use your saved answers?' }),
    ).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'START A NEW SURVEY' }),
    );
    expect(screen.getByText('Question 1 of 7')).toBeVisible();
  });

  it('opens directly on the review page for account updates', () => {
    const saved = {
      accepts_annual_fee: false,
      card_filter_preferences: [],
      category_monthly_spend: [],
      credit_score_band: 'good',
      extra_benefit_slugs: [],
      income_range: '40001_to_60000',
      primary_goal: 'travel_rewards',
      priority_category_slugs: ['groceries'],
      user_filter_preferences: [],
      user_preferences: {
        accepts_annual_fee: false,
        wants_travel_rewards: true,
      },
    } as SurveySubmission;

    render(<SurveyForm savedSubmission={saved} startAtReview />);

    expect(
      screen.getByRole('heading', { name: 'Review your answers' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'Use your saved answers?' }),
    ).not.toBeInTheDocument();
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
