'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import { QuestionHelp } from './question-help';

export function SurveyQuestionStep({
  children,
  explanation,
  question,
  questionNumber,
  totalQuestions,
}: {
  children: ReactNode;
  explanation: string;
  question: string;
  questionNumber: number;
  totalQuestions: number;
}) {
  const headingRef = useRef<HTMLLegendElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [questionNumber]);

  return (
    <section className="survey-step" aria-labelledby="survey-question">
      <p className="eyebrow">
        Question {questionNumber} of {totalQuestions}
      </p>
      <fieldset className="question-block">
        <legend id="survey-question" ref={headingRef} tabIndex={-1}>
          {question}
        </legend>
        <QuestionHelp label={question}>{explanation}</QuestionHelp>
        {children}
      </fieldset>
    </section>
  );
}
