'use client';

import { useState } from 'react';

import { questions } from './questions';
import styles from './survey.module.css';

type Screen = 'intro' | 'question' | 'review' | 'results';
type Answers = Record<string, string[]>;
type MatchRating = 'Best match' | 'Okay match' | 'Worst match';
type MatchTone = 'best' | 'okay' | 'worst';

type CardMatchOutline = {
  id: string;
  name: string;
  rating: MatchRating;
  tone: MatchTone;
  details: string;
  //url: string; //FEATURE, urllink to be clicked on
};

//These are temporary card objects, I am not sure whether there should be a limit in this array
//The list should be created after getting some results from Supabase

const cardMatchOutline: readonly CardMatchOutline[] = [
  {
    id: 'savorone',
    name: 'Capital One SavorOne Rewards',
    rating: 'Best match',
    tone: 'best',
    details:
      'No annual fee and cash back on dining, groceries, and entertainment.',
  },
  {
    id: 'freedom-unlimited',
    name: 'Chase Freedom Unlimited',
    rating: 'Okay match',
    tone: 'okay',
    details:
      'A flexible cash-back option, but its bonus categories may not align with every preference.',
  },
  {
    id: 'platinum-card',
    name: 'The Platinum Card from American Express',
    rating: 'Worst match',
    tone: 'worst',
    details:
      'Its high annual fee and travel-focused benefits may not suit the selected preferences.',
  },
];

export default function SurveyFlow() {
  const [answers, setAnswers] = useState<Answers>({});
  const [screen, setScreen] = useState<Screen>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const question = questions[questionIndex];
  const selected = answers[question?.id] ?? [];

  function startSurvey() {
    setAnswers({});
    setQuestionIndex(0);
    setExpandedCardId(null);
    setScreen('question');
  }

  function selectOption(option: string) {
    setAnswers((currentAnswers) => {
      const current = currentAnswers[question.id] ?? [];
      let next: string[];

      if (question.type === 'single') {
        next = [option];
      } else if (option === question.exclusiveOption) {
        next = [option];
      } else {
        const withoutExclusive = current.filter(
          (answer) => answer !== question.exclusiveOption,
        );
        next = withoutExclusive.includes(option)
          ? withoutExclusive.filter((answer) => answer !== option)
          : [...withoutExclusive, option];

        if (question.maxSelections && next.length > question.maxSelections) {
          next = withoutExclusive;
        }
      }

      return { ...currentAnswers, [question.id]: next };
    });
  }

  function showNext() {
    if (questionIndex === questions.length - 1) {
      setScreen('review');
      return;
    }

    setQuestionIndex((index) => index + 1);
  }

  if (screen === 'intro') {
    return (
      <main className={styles.shell}>
        <section className={styles.panel} aria-labelledby="survey-title">
          <p className={styles.eyebrow}>Credit card survey</p>
          <h1 id="survey-title">Find the card features that fit you</h1>
          <p className={styles.intro}>
            Answer six short questions about your preferences. Your responses
            stay in this browser while you complete the survey.
          </p>
          <button
            className={styles.primaryButton}
            onClick={startSurvey}
            type="button"
          >
            Start quiz
          </button>
        </section>
      </main>
    );
  }

  if (screen === 'review') {
    return (
      <main className={styles.shell}>
        <section className={styles.panel} aria-labelledby="review-title">
          <p className={styles.eyebrow}>Step 6 of 6</p>
          <h1 id="review-title">Review your answers</h1>
          <p className={styles.intro}>
            Select any question to revise your response before submitting.
          </p>
          <ol className={styles.reviewList}>
            {questions.map((item, index) => (
              <li key={item.id}>
                <button
                  className={styles.reviewButton}
                  onClick={() => {
                    setQuestionIndex(index);
                    setScreen('question');
                  }}
                  type="button"
                >
                  <span>{item.prompt}</span>
                  <strong>{answers[item.id].join(', ')}</strong>
                  <span className={styles.editLabel}>Edit</span>
                </button>
              </li>
            ))}
          </ol>
          <button
            className={styles.primaryButton}
            onClick={() => setScreen('results')}
            type="button"
          >
            Submit quiz
          </button>
        </section>
      </main>
    );
  }

  if (screen === 'results') {
    return (
      <main className={styles.shell}>
        <section className={styles.panel} aria-labelledby="results-title">
          <p className={styles.eyebrow}>Results outline</p>
          <h1 id="results-title">Your card matches</h1>
          <p className={styles.intro}>
            This preview shows how cards from Supabase will appear once matching
            rules are available. Expand a card to review its match and additional details.
          </p>
          <ul className={styles.resultList}>
            {cardMatchOutline.map((card) => {
              const isExpanded = expandedCardId === card.id;
              const detailId = `${card.id}-details`;

              return (
                <li className={styles.resultCard} key={card.id}>
                  <div className={styles.resultSummary}>
                    <div>
                      <h2>{card.name}</h2>
                      <p
                        className={`${styles.matchBadge} ${styles[card.tone]}`}
                      >
                        {card.rating}
                      </p>
                    </div>
                    <button
                      aria-controls={detailId}
                      aria-expanded={isExpanded}
                      className={styles.secondaryButton}
                      onClick={() =>
                        setExpandedCardId((currentId) =>
                          currentId === card.id ? null : card.id,
                        )
                      }
                      type="button"
                    >
                      {isExpanded
                        ? `Hide details for ${card.name}`
                        : `Show details for ${card.name}`}
                    </button>
                  </div>
                  {isExpanded ? (
                    <div className={styles.resultDetails} id={detailId}>
                      <h3>Why it received this rating</h3>
                      <p>{card.details}</p>
                      <h3>URL GOES HERE[WIP]</h3>
                      {/*<p>card.url</p>*/}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <button
            className={styles.secondaryButton}
            onClick={startSurvey}
            type="button"
          >
            Start over
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <section
        className={styles.panel}
        aria-labelledby={`question-${question.id}`}
      >
        <p className={styles.eyebrow}>
          Question {questionIndex + 1} of {questions.length}
        </p>
        <h1 id={`question-${question.id}`}>{question.prompt}</h1>
        <p className={styles.intro}>{question.helpText}</p>
        <fieldset className={styles.options}>
          <legend className={styles.srOnly}>{question.prompt}</legend>
          {question.options.map((option) => {
            const isSelected = selected.includes(option);
            const selectionLimitReached =
              question.type === 'multiple' &&
              question.maxSelections !== undefined &&
              selected.length >= question.maxSelections &&
              !isSelected;

            return (
              <label className={styles.option} key={option}>
                <input
                  checked={isSelected}
                  disabled={selectionLimitReached}
                  name={question.id}
                  onChange={() => selectOption(option)}
                  type={question.type === 'single' ? 'radio' : 'checkbox'}
                  value={option}
                />
                <span>{option}</span>
              </label>
            );
          })}
        </fieldset>
        <div className={styles.actions}>
          {questionIndex > 0 ? (
            <button
              className={styles.secondaryButton}
              onClick={() => setQuestionIndex((index) => index - 1)}
              type="button"
            >
              Previous question
            </button>
          ) : null}
          <button
            className={styles.primaryButton}
            disabled={selected.length === 0}
            onClick={showNext}
            type="button"
          >
            {questionIndex === questions.length - 1
              ? 'Review answers'
              : 'Next question'}
          </button>
        </div>
      </section>
    </main>
  );
}
