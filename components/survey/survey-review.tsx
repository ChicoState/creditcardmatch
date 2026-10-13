'use client';

import { useEffect, useRef } from 'react';

export type ReviewItem = { answer: string; question: string };

export function SurveyReview({
  items,
  onEdit,
}: {
  items: readonly ReviewItem[];
  onEdit: (index: number) => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className="survey-review" aria-labelledby="review-title">
      <p className="eyebrow">Ready to submit</p>
      <h2 id="review-title" ref={headingRef} tabIndex={-1}>
        Review your answers
      </h2>
      <p>Select a question to revise it before seeing your matches.</p>
      <ol className="survey-review-list">
        {items.map((item, index) => (
          <li key={item.question}>
            <button onClick={() => onEdit(index)} type="button">
              <span>{item.question}</span>
              <strong>{item.answer}</strong>
              <span>Edit</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
