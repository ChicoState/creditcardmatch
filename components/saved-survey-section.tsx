'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { clearSurveyAnswersAction } from '../lib/account/actions';
import type { SavedSurveyData } from '../lib/account/types';
import { SurveyAnswerSummary } from './survey-answer-summary';

export function SavedSurveySection({
  savedSurvey,
}: {
  savedSurvey: SavedSurveyData | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [cleared, setCleared] = useState(false);
  const current = cleared ? null : savedSurvey;

  function clear() {
    setError('');
    startTransition(async () => {
      const result = await clearSurveyAnswersAction();
      if (!result.ok) {
        setError(result.error ?? 'Unable to clear your saved survey.');
        return;
      }
      setCleared(true);
    });
  }

  return (
    <section
      className="account-section saved-survey-section"
      aria-labelledby="saved-survey-heading"
    >
      <h2 id="saved-survey-heading">Saved survey</h2>
      {current ? (
        <>
          <p>
            Your answers are saved. Review your recommended cards without
            retaking the survey, or update your answers when your priorities
            change.
          </p>
          {current.savedAt ? (
            <p className="account-help">
              Saved {new Date(current.savedAt).toLocaleDateString()}
            </p>
          ) : null}
          <SurveyAnswerSummary answers={current.answers} />
          <div className="account-editor-actions">
            <Link className="primary-action" href="/results?mode=saved">
              View my recommended cards
            </Link>
            <Link className="secondary-action" href="/survey?review=1">
              Update saved answers
            </Link>
            <button
              className="secondary-action"
              disabled={pending}
              onClick={clear}
              type="button"
            >
              {pending ? 'Clearing…' : 'Clear saved survey'}
            </button>
          </div>
        </>
      ) : (
        <>
          <p>
            Save your survey answers to return to personalized card
            recommendations without taking the survey again.
          </p>
          <Link className="primary-action" href="/survey">
            Take the survey
          </Link>
        </>
      )}
      {error ? (
        <p className="account-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
