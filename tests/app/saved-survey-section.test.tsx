import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  clearSurveyAnswersAction: vi.fn(),
  clearSurveyAnswers: vi.fn(),
}));

vi.mock('../../lib/account/actions', () => ({
  clearSurveyAnswersAction: mocks.clearSurveyAnswersAction,
}));
vi.mock('../../lib/storage/survey-storage', () => ({
  clearSurveyAnswers: mocks.clearSurveyAnswers,
}));

import { SavedSurveySection } from '../../components/saved-survey-section';
import type { SavedSurveyData } from '../../lib/account/types';

const savedSurvey: SavedSurveyData = {
  savedAt: '2026-11-18T12:00:00.000Z',
  answers: {
    accepts_annual_fee: false,
    card_filter_preferences: [{ filter_slug: 'cashback', preference: 'want' }],
    category_monthly_spend: [
      { category_slug: 'groceries', monthly_amount: 250 },
    ],
    credit_score_band: 'good',
    extra_benefit_slugs: [],
    income_range: '40001_to_60000',
    primary_goal: 'cash_back',
    priority_category_slugs: ['groceries'],
    user_filter_preferences: [{ filter_slug: 'cashback', preference: 'want' }],
    user_preferences: {
      accepts_annual_fee: false,
      wants_travel_rewards: false,
    },
  },
};

describe('SavedSurveySection', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('clears server and browser survey data together', async () => {
    mocks.clearSurveyAnswersAction.mockResolvedValue({ ok: true });
    mocks.clearSurveyAnswers.mockReturnValue(true);

    render(<SavedSurveySection savedSurvey={savedSurvey} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear saved survey' }));

    await waitFor(() => {
      expect(mocks.clearSurveyAnswersAction).toHaveBeenCalledOnce();
      expect(mocks.clearSurveyAnswers).toHaveBeenCalledOnce();
      expect(
        screen.getByRole('link', { name: 'Take the survey' }),
      ).toBeVisible();
    });
  });

  it('reports a browser-storage failure after clearing server data', async () => {
    mocks.clearSurveyAnswersAction.mockResolvedValue({ ok: true });
    mocks.clearSurveyAnswers.mockReturnValue(false);

    render(<SavedSurveySection savedSurvey={savedSurvey} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear saved survey' }));

    await waitFor(() =>
      expect(
        screen.getByText(/account survey was cleared, but we could not clear/i),
      ).toBeVisible(),
    );
  });
});
