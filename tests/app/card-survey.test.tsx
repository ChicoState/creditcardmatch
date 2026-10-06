import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import SurveyFlow from '../../app/card_survey/survey-flow';

describe('SurveyFlow', () => {
  it('collects temporary answers, allows review edits, and expands card match details', async () => {
    const user = userEvent.setup();

    render(<SurveyFlow />);

    await user.click(screen.getByRole('button', { name: 'Start quiz' }));
    expect(
      screen.getByRole('heading', { name: 'How much do you earn annually?' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Back to intro' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Next question' }),
    ).toBeDisabled();

    await user.click(screen.getByLabelText('$60,001–$80,000'));
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.click(screen.getByLabelText('Good (670–739)'));
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.click(screen.getByLabelText('Cash back'));
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.click(screen.getByLabelText('Groceries'));
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.click(screen.getByLabelText('Up to $95 per year'));
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.click(screen.getByLabelText('Purchase protection'));
    await user.click(screen.getByRole('button', { name: 'Review answers' }));

    expect(
      screen.getByRole('heading', { name: 'Review your answers' }),
    ).toBeVisible();
    expect(screen.getByText('$60,001–$80,000')).toBeVisible();

    await user.click(
      screen.getByRole('button', {
        name: /How much do you earn annually.*Edit/,
      }),
    );
    expect(screen.getByLabelText('$60,001–$80,000')).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.click(screen.getByRole('button', { name: 'Review answers' }));
    await user.click(screen.getByRole('button', { name: 'Submit quiz' }));

    expect(
      screen.getByRole('heading', { name: 'Your card matches' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Capital One SavorOne Rewards' }),
    ).toBeVisible();
    expect(screen.getByText('Best match')).toBeVisible();
    expect(
      screen.queryByText(
        'No annual fee and cash back on dining, groceries, and entertainment.',
      ),
    ).not.toBeInTheDocument();

    const detailsButton = screen.getByRole('button', {
      name: 'Show details for Capital One SavorOne Rewards',
    });
    await user.click(detailsButton);

    expect(detailsButton).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByText(
        'No annual fee and cash back on dining, groceries, and entertainment.',
      ),
    ).toBeVisible();
  });
});
