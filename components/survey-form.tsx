'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';

import {
  deriveSurveySubmission,
  SURVEY_CATEGORIES,
  SURVEY_CONFIG,
  surveySubmissionToFormValues,
  type SurveySubmission,
} from '../lib/config/survey';
import { saveSurveyAnswersAction } from '../lib/account/actions';
import { buildResultsHref } from '../lib/results/query-string';
import {
  loadSurveyAnswers,
  saveSurveyAnswers,
} from '../lib/storage/survey-storage';
import { SurveyQuestionContent } from './survey/survey-question-content';
import { SurveyQuestionStep } from './survey/survey-question-step';
import { SurveyReview, type ReviewItem } from './survey/survey-review';
import type { SurveyValues } from './survey/types';

const TOTAL_QUESTIONS = 7;

function initialValues(): SurveyValues {
  return {
    acceptsAnnualFee: null,
    categorySpend: Object.fromEntries(
      SURVEY_CATEGORIES.map((category) => [category.slug, '']),
    ),
    creditScore: '',
    extraBenefits: [],
    incomeRange: '',
    primaryGoal: '',
    priorityCategories: [],
  };
}

function selectedLabels(
  values: string[],
  options: readonly { label: string; value: string }[],
): string {
  const labels = options
    .filter((option) => values.includes(option.value))
    .map((option) => option.label);
  return labels.length > 0 ? labels.join(', ') : 'No preference selected';
}

function selectedCategoryLabels(values: string[]): string {
  const labels = SURVEY_CATEGORIES.filter((category) =>
    values.includes(category.slug),
  ).map((category) => category.label);
  return labels.length > 0 ? labels.join(', ') : 'No categories selected';
}

function isStepComplete(step: number, values: SurveyValues): boolean {
  switch (step) {
    case 0:
      return Boolean(values.incomeRange);
    case 1:
      return Boolean(values.creditScore);
    case 2:
      return Boolean(values.primaryGoal);
    case 3:
      return values.priorityCategories.length > 0;
    case 4:
      return values.priorityCategories.every((categorySlug) => {
        const amount = Number(values.categorySpend[categorySlug]);
        return Number.isFinite(amount) && amount > 0;
      });
    case 5:
      return values.acceptsAnnualFee !== null;
    default:
      return true;
  }
}

export function SurveyForm({
  savedSubmission = null,
  startAtReview = false,
}: {
  savedSubmission?: SurveySubmission | null;
  startAtReview?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [step, setStep] = useState(
    startAtReview && savedSubmission ? TOTAL_QUESTIONS : 0,
  );
  const [values, setValues] = useState<SurveyValues>(() =>
    startAtReview && savedSubmission
      ? surveySubmissionToFormValues(savedSubmission)
      : initialValues(),
  );
  const [savedChoicePending, setSavedChoicePending] = useState(
    Boolean(savedSubmission) && !startAtReview,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !window.location.search.includes('save=1')
    ) {
      return;
    }

    const submission = loadSurveyAnswers();
    if (!submission) {
      queueMicrotask(() =>
        setSaveError(
          'Your survey answers could not be restored. Please start again.',
        ),
      );
      return;
    }

    queueMicrotask(() => {
      setValues(surveySubmissionToFormValues(submission));
      setStep(TOTAL_QUESTIONS);
      setSaving(true);
      saveSurveyAnswersAction(submission)
        .then((result) => {
          if (result.ok) {
            router.push(
              `${buildResultsHref(
                submission.card_filter_preferences.map(
                  ({ filter_slug }) => filter_slug,
                ),
                'survey',
              )}&saved=1`,
            );
          } else {
            setSaveError(
              result.error ?? 'We could not save your survey answers.',
            );
          }
        })
        .catch(() => setSaveError('We could not save your survey answers.'))
        .finally(() => setSaving(false));
    });
  }, [router]);

  function showNextQuestion() {
    if (!formRef.current?.reportValidity() || !isStepComplete(step, values)) {
      return;
    }

    setStep((current) => current + 1);
  }

  function togglePriorityCategory(categorySlug: string) {
    setValues((current) => {
      const selected = current.priorityCategories.includes(categorySlug);

      if (selected) {
        return {
          ...current,
          priorityCategories: current.priorityCategories.filter(
            (category) => category !== categorySlug,
          ),
        };
      }

      if (
        current.priorityCategories.length >=
        SURVEY_CONFIG.priorityCategories.maxSelections
      ) {
        return current;
      }

      return {
        ...current,
        priorityCategories: [...current.priorityCategories, categorySlug],
      };
    });
  }

  function toggleExtraBenefit(benefitSlug: string) {
    setValues((current) => {
      const noneOption = SURVEY_CONFIG.extraBenefits.exclusiveOption;

      if (benefitSlug === noneOption) {
        return {
          ...current,
          extraBenefits: current.extraBenefits.includes(noneOption)
            ? []
            : [noneOption],
        };
      }

      const benefits = current.extraBenefits.filter(
        (benefit) => benefit !== noneOption,
      );

      return {
        ...current,
        extraBenefits: benefits.includes(benefitSlug)
          ? benefits.filter((benefit) => benefit !== benefitSlug)
          : [...benefits, benefitSlug],
      };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submission = deriveSurveySubmission(values);

    saveSurveyAnswers(submission);
    router.push(
      buildResultsHref(
        submission.card_filter_preferences.map(
          ({ filter_slug }) => filter_slug,
        ),
        'survey',
      ),
    );
  }

  async function saveAnswers() {
    const submission = deriveSurveySubmission(values);
    saveSurveyAnswers(submission);
    setSaving(true);
    setSaveError('');
    try {
      const result = await saveSurveyAnswersAction(submission);
      if (result.requiresAuth) {
        router.push(`/login?next=${encodeURIComponent('/survey?save=1')}`);
        return;
      }
      if (!result.ok) {
        setSaveError(result.error ?? 'We could not save your survey answers.');
        return;
      }
      router.push(
        `${buildResultsHref(
          submission.card_filter_preferences.map(
            ({ filter_slug }) => filter_slug,
          ),
          'survey',
        )}&saved=1`,
      );
    } catch {
      setSaveError('We could not save your survey answers.');
    } finally {
      setSaving(false);
    }
  }

  const reviewItems: ReviewItem[] = [
    {
      question: SURVEY_CONFIG.income.prompt,
      answer: selectedLabels(
        values.incomeRange ? [values.incomeRange] : [],
        SURVEY_CONFIG.income.options,
      ),
    },
    {
      question: SURVEY_CONFIG.creditScore.prompt,
      answer: selectedLabels(
        values.creditScore ? [values.creditScore] : [],
        SURVEY_CONFIG.creditScore.options,
      ),
    },
    {
      question: SURVEY_CONFIG.primaryGoal.prompt,
      answer: selectedLabels(
        values.primaryGoal ? [values.primaryGoal] : [],
        SURVEY_CONFIG.primaryGoal.options,
      ),
    },
    {
      question: SURVEY_CONFIG.priorityCategories.prompt,
      answer: selectedCategoryLabels(values.priorityCategories),
    },
    {
      question: SURVEY_CONFIG.categorySpend.prompt,
      answer:
        SURVEY_CATEGORIES.filter(
          (category) =>
            values.priorityCategories.includes(category.slug) &&
            values.categorySpend[category.slug],
        )
          .map(
            (category) =>
              `${category.label}: $${values.categorySpend[category.slug]}`,
          )
          .join(', ') || 'No monthly estimates provided',
    },
    {
      question: SURVEY_CONFIG.annualFee.prompt,
      answer: values.acceptsAnnualFee ? 'Yes' : 'No',
    },
    {
      question: SURVEY_CONFIG.extraBenefits.prompt,
      answer: selectedLabels(
        values.extraBenefits,
        SURVEY_CONFIG.extraBenefits.options,
      ),
    },
  ];

  if (step === TOTAL_QUESTIONS) {
    return (
      <form className="survey-form" onSubmit={handleSubmit} ref={formRef}>
        <SurveyReview items={reviewItems} onEdit={setStep} />
        <p className="survey-save-copy">
          Choose whether to save these answers to your account. You can still
          review your recommended cards without saving.
        </p>
        {saveError ? (
          <p className="form-error" role="alert">
            {saveError}
          </p>
        ) : null}
        <div className="survey-submit-actions">
          <button
            className="primary-action survey-submit"
            disabled={saving}
            onClick={(event) => {
              event.preventDefault();
              void saveAnswers();
            }}
            type="button"
          >
            {saving ? 'SAVING…' : 'SAVE ANSWERS'}
          </button>
          <button
            className="secondary-action survey-submit"
            disabled={saving}
            type="submit"
          >
            SEE MY MATCHES
          </button>
        </div>
      </form>
    );
  }

  if (savedChoicePending && savedSubmission) {
    return (
      <section
        className="survey-saved-choice"
        aria-labelledby="saved-choice-heading"
      >
        <p className="eyebrow">Saved survey found</p>
        <h2 id="saved-choice-heading">Use your saved answers?</h2>
        <p>
          Review recommendations from your saved answers, or start a new survey
          with different preferences.
        </p>
        <div className="survey-submit-actions">
          <button
            className="primary-action"
            onClick={() => {
              setValues(surveySubmissionToFormValues(savedSubmission));
              setStep(TOTAL_QUESTIONS);
              setSavedChoicePending(false);
            }}
            type="button"
          >
            USE SAVED ANSWERS
          </button>
          <button
            className="secondary-action"
            onClick={() => {
              setValues(initialValues());
              setStep(0);
              setSavedChoicePending(false);
            }}
            type="button"
          >
            START A NEW SURVEY
          </button>
        </div>
      </section>
    );
  }

  const currentQuestion = [
    SURVEY_CONFIG.income,
    SURVEY_CONFIG.creditScore,
    SURVEY_CONFIG.primaryGoal,
    SURVEY_CONFIG.priorityCategories,
    SURVEY_CONFIG.categorySpend,
    SURVEY_CONFIG.annualFee,
    SURVEY_CONFIG.extraBenefits,
  ][step];

  return (
    <form className="survey-form" onSubmit={handleSubmit} ref={formRef}>
      <SurveyQuestionStep
        explanation={currentQuestion.description}
        question={currentQuestion.prompt}
        questionNumber={step + 1}
        totalQuestions={TOTAL_QUESTIONS}
      >
        <SurveyQuestionContent
          onChangeCategorySpend={(categorySlug, amount) =>
            setValues((current) => ({
              ...current,
              categorySpend: {
                ...current.categorySpend,
                [categorySlug]: amount,
              },
            }))
          }
          onSelectAnnualFee={(acceptsAnnualFee) =>
            setValues((current) => ({ ...current, acceptsAnnualFee }))
          }
          onSelectCreditScore={(creditScore) =>
            setValues((current) => ({ ...current, creditScore }))
          }
          onSelectIncomeRange={(incomeRange) =>
            setValues((current) => ({ ...current, incomeRange }))
          }
          onSelectPrimaryGoal={(primaryGoal) =>
            setValues((current) => ({ ...current, primaryGoal }))
          }
          onToggleExtraBenefit={toggleExtraBenefit}
          onTogglePriorityCategory={togglePriorityCategory}
          step={step}
          values={values}
        />
      </SurveyQuestionStep>
      <div className="survey-actions">
        {step > 0 ? (
          <button
            className="secondary-action"
            onClick={() => setStep((current) => current - 1)}
            type="button"
          >
            Previous question
          </button>
        ) : (
          <span />
        )}
        <button
          className="primary-action"
          disabled={!isStepComplete(step, values)}
          onClick={showNextQuestion}
          type="button"
        >
          {step === TOTAL_QUESTIONS - 1 ? 'Review answers' : 'Next question'}
        </button>
      </div>
    </form>
  );
}
