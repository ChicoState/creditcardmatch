'use client';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { submitCardRequest } from '../lib/card-requests/actions';
import type { FilterRow, RewardCategoryRow } from '../lib/catalog/types';
import type { RequestResult } from '../lib/card-requests/types';
import { CardDetailFields, readCardDetails } from './card-detail-fields';
export function CardRequestForm({
  filters,
  rewardCategories,
}: {
  filters: FilterRow[];
  rewardCategories: RewardCategoryRow[];
}) {
  const [result, setResult] = useState<RequestResult>();
  const [pending, start] = useTransition();
  if (result?.ok)
    return (
      <div role="status">
        <h2>Request submitted</h2>
        <p>We’ll review your card before adding it to the catalog.</p>
        <Link href="/account/card-requests">View your card requests</Link>
      </div>
    );
  return (
    <form
      className="card-request-form"
      onSubmit={(event) => {
        event.preventDefault();
        const input = readCardDetails(event.currentTarget);
        start(async () => {
          try {
            setResult(await submitCardRequest(input));
          } catch {
            setResult({
              ok: false,
              code: 'persistence',
              message: 'Unable to submit. Please try again.',
            });
          }
        });
      }}
    >
      <p>
        Required: card name, issuer, official card URL, and at least one catalog
        tag. Share product information only; never enter card numbers or account
        details.
      </p>
      <CardDetailFields
        filters={filters}
        categories={rewardCategories}
        errors={result && !result.ok ? result.fields : undefined}
      />
      {result && !result.ok ? (
        <p role="alert" className="form-error">
          {result.message}
        </p>
      ) : null}
      <button className="primary-action" disabled={pending} type="submit">
        {pending ? 'Submitting…' : 'Submit request'}
      </button>
    </form>
  );
}
