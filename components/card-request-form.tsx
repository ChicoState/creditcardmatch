'use client';

import { useState, useTransition } from 'react';

import { submitCardRequestAction } from '../lib/account/actions';
import type { RewardCategoryRow } from '../lib/catalog/types';

interface CardRequestFormProps {
  rewardCategories: RewardCategoryRow[];
  onCancel: () => void;
  onSubmitted: () => void;
}

export function CardRequestForm({
  rewardCategories,
  onCancel,
  onSubmitted,
}: CardRequestFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await submitCardRequestAction(formData);
        onSubmitted();
      } catch (submissionError) {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : 'We could not submit your request.',
        );
      }
    });
  }

  return (
    <form className="card-request-form" onSubmit={submit}>
      <div className="card-request-form__header">
        <div>
          <h3>Request a missing card</h3>
          <p>
            We’ll review your request before adding anything to the catalog.
          </p>
        </div>
        <button className="text-button" onClick={onCancel} type="button">
          Cancel
        </button>
      </div>
      <label>
        Card name
        <input maxLength={160} name="card_name" required type="text" />
      </label>
      <label>
        Issuer
        <input maxLength={120} name="issuer" required type="text" />
      </label>
      <fieldset>
        <legend>Reward categories</legend>
        {rewardCategories.map((category) => (
          <label className="card-request-form__checkbox" key={category.slug}>
            <input name="reward_type" type="checkbox" value={category.slug} />
            {category.category_name}
          </label>
        ))}
      </fieldset>
      <label>
        Notification email <span>(optional)</span>
        <input name="notification_email" type="email" />
      </label>
      <label>
        Comments <span>(optional)</span>
        <textarea maxLength={2000} name="comments" rows={4} />
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="primary-action" disabled={isPending} type="submit">
        {isPending ? 'Submitting…' : 'Submit request'}
      </button>
    </form>
  );
}
