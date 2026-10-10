'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';

import {
  deriveSurveySubmission,
  SURVEY_CATEGORIES,
  SURVEY_CONFIG,
} from '../lib/config/survey';
import { buildResultsHref } from '../lib/results/query-string';
import { saveSurveyAnswers } from '../lib/storage/survey-storage';
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
    case 5:
      return values.acceptsAnnualFee !== null;
    default:
      return true;
  }
}

export function SurveyForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<SurveyValues>(initialValues);

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
      ),
    );
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
        <button className="primary-action survey-submit" type="submit">
          SEE MY MATCHES
        </button>
      </form>
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
