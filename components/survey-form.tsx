'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent, ReactNode } from 'react';

import { deriveSurveySubmission, SURVEY_CONFIG } from '../lib/config/survey';
import { buildResultsHref } from '../lib/results/query-string';
import { saveSurveyAnswers } from '../lib/storage/survey-storage';

function QuestionHelp({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <details className="question-help">
      <summary aria-label={`Explain: ${label}`}>?</summary>
      <p>{children}</p>
    </details>
  );
}

export function SurveyForm() {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submission = deriveSurveySubmission({
      incomeRange: String(formData.get('incomeRange') ?? ''),
      creditHistory: String(formData.get('creditHistory') ?? ''),
      categorySpend: Object.fromEntries(
        SURVEY_CONFIG.categorySpend.categories.map((category) => [
          category.slug,
          String(formData.get(`spend:${category.slug}`) ?? ''),
        ]),
      ),
      desiredFeatures: formData.getAll('desiredFeatures').map(String),
      unwantedFeatures: formData.getAll('unwantedFeatures').map(String),
    });

    saveSurveyAnswers(submission);
    router.push(buildResultsHref(submission.derived_filter_slugs));
  }

  return (
    <form className="survey-form" onSubmit={handleSubmit}>
      <fieldset className="question-block">
        <legend>{SURVEY_CONFIG.income.question}</legend>
        <QuestionHelp label={SURVEY_CONFIG.income.question}>
          {SURVEY_CONFIG.income.explanation}
        </QuestionHelp>
        <div className="answer-list">
          {SURVEY_CONFIG.income.options.map((option) => (
            <label className="choice-row" key={option.value}>
              <input
                name="incomeRange"
                required
                type="radio"
                value={option.value}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="question-block">
        <legend>{SURVEY_CONFIG.creditHistory.question}</legend>
        <QuestionHelp label={SURVEY_CONFIG.creditHistory.question}>
          {SURVEY_CONFIG.creditHistory.explanation}
        </QuestionHelp>
        <div className="answer-list">
          {SURVEY_CONFIG.creditHistory.options.map((option) => (
            <label className="choice-row" key={option.value}>
              <input
                name="creditHistory"
                required
                type="radio"
                value={option.value}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="question-block">
        <legend>{SURVEY_CONFIG.categorySpend.question}</legend>
        <QuestionHelp label={SURVEY_CONFIG.categorySpend.question}>
          {SURVEY_CONFIG.categorySpend.explanation}
        </QuestionHelp>
        <div className="spend-grid">
          {SURVEY_CONFIG.categorySpend.categories.map((category) => (
            <label className="spend-field" key={category.slug}>
              <span>{category.label}</span>
              <span className="currency-input">
                <span aria-hidden="true">$</span>
                <input
                  inputMode="decimal"
                  min="0"
                  name={`spend:${category.slug}`}
                  placeholder="0"
                  step="0.01"
                  type="number"
                />
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="question-block">
        <legend>{SURVEY_CONFIG.desiredFeatures.question}</legend>
        <QuestionHelp label={SURVEY_CONFIG.desiredFeatures.question}>
          {SURVEY_CONFIG.desiredFeatures.explanation}
        </QuestionHelp>
        <div className="answer-list">
          {SURVEY_CONFIG.desiredFeatures.options.map((option) => (
            <label className="choice-row" key={option.value}>
              <input
                name="desiredFeatures"
                type="checkbox"
                value={option.value}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="question-block">
        <legend>{SURVEY_CONFIG.unwantedFeatures.question}</legend>
        <QuestionHelp label={SURVEY_CONFIG.unwantedFeatures.question}>
          {SURVEY_CONFIG.unwantedFeatures.explanation}
        </QuestionHelp>
        <div className="answer-list">
          {SURVEY_CONFIG.unwantedFeatures.options.map((option) => (
            <label className="choice-row" key={option.value}>
              <input
                name="unwantedFeatures"
                type="checkbox"
                value={option.value}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <button className="primary-action survey-submit" type="submit">
        SEE MY MATCHES
      </button>
    </form>
  );
}
