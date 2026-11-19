// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deriveSurveySubmission } from '../../lib/config/survey';
import {
  clearSurveyAnswersAction,
  saveSurveyAnswersAction,
} from '../../lib/account/actions';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('../../lib/auth/server', () => ({
  createAuthAdminClient: vi.fn(),
  createAuthServerClient: async () => ({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
    rpc: mocks.rpc,
  }),
}));

function validSubmission() {
  return deriveSurveySubmission({
    acceptsAnnualFee: false,
    categorySpend: { groceries: '250' },
    creditScore: 'good',
    extraBenefits: [],
    incomeRange: '40001_to_60000',
    primaryGoal: 'cash_back',
    priorityCategories: ['groceries'],
  });
}

describe('survey save input boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'session-owner' } },
      error: null,
    });
    mocks.rpc.mockResolvedValue({ error: null });
  });

  it.each([
    ['null input', null],
    [
      'null nested spending',
      { ...validSubmission(), category_monthly_spend: [null] },
    ],
    [
      'null nested filter',
      { ...validSubmission(), user_filter_preferences: [null] },
    ],
    [
      'duplicate filters',
      {
        ...validSubmission(),
        user_filter_preferences: [
          validSubmission().user_filter_preferences[0],
          validSubmission().user_filter_preferences[0],
        ],
      },
    ],
    [
      'incomplete spending',
      { ...validSubmission(), category_monthly_spend: [] },
    ],
    [
      'unexpected fields',
      { ...validSubmission(), injected: 'must not be persisted' },
    ],
  ])(
    'returns a controlled error for %s before database access',
    async (_label, payload) => {
      await expect(saveSurveyAnswersAction(payload)).resolves.toEqual({
        ok: false,
        error: 'Those survey answers are invalid.',
      });
      expect(mocks.getUser).not.toHaveBeenCalled();
      expect(mocks.from).not.toHaveBeenCalled();
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    },
  );

  it('continues to require authentication for valid submissions', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(saveSurveyAnswersAction(validSubmission())).resolves.toEqual({
      ok: false,
      requiresAuth: true,
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('saves the complete submission through one owner-scoped RPC', async () => {
    const submission = validSubmission();
    await expect(saveSurveyAnswersAction(submission)).resolves.toEqual({
      ok: true,
    });
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('save_survey_answers', {
      p_submission: submission,
    });
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/account');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/survey');
  });

  it('clears all survey state through one owner-scoped RPC', async () => {
    await expect(clearSurveyAnswersAction()).resolves.toEqual({ ok: true });
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('clear_survey_answers');
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/account');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/survey');
  });

  it.each(['save', 'clear'] as const)(
    'rejects an expired session for %s',
    async (operation) => {
      mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
      const result =
        operation === 'save'
          ? await saveSurveyAnswersAction(validSubmission())
          : await clearSurveyAnswersAction();
      expect(result).toEqual({ ok: false, requiresAuth: true });
      expect(mocks.rpc).not.toHaveBeenCalled();
      expect(mocks.from).not.toHaveBeenCalled();
    },
  );

  it.each(['save', 'clear'] as const)(
    'rejects an authentication error for %s even if a user is returned',
    async (operation) => {
      mocks.getUser.mockResolvedValue({
        data: { user: { id: 'session-owner' } },
        error: new Error('untrusted session'),
      });
      const result =
        operation === 'save'
          ? await saveSurveyAnswersAction(validSubmission())
          : await clearSurveyAnswersAction();
      expect(result).toEqual({ ok: false, requiresAuth: true });
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['save', false],
    ['clear', false],
    ['save', true],
    ['clear', true],
  ] as const)(
    'returns a controlled error for %s failure (throws: %s)',
    async (operation, throws) => {
      const databaseError = new Error('private SQL failure details');
      if (throws) mocks.rpc.mockRejectedValue(databaseError);
      else mocks.rpc.mockResolvedValue({ error: databaseError });
      const result =
        operation === 'save'
          ? await saveSurveyAnswersAction(validSubmission())
          : await clearSurveyAnswersAction();
      expect(result).toEqual({
        ok: false,
        error:
          operation === 'save'
            ? 'Unable to save your survey answers.'
            : 'Unable to clear your saved survey.',
      });
      expect(mocks.rpc).toHaveBeenCalledTimes(1);
      expect(mocks.from).not.toHaveBeenCalled();
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    },
  );
});
