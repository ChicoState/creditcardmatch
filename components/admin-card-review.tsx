'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { CardDetails } from '../lib/card-requests/details';
import type { RequestResult, RequestSummary } from '../lib/card-requests/types';
import type { CatalogSnapshot } from '../lib/catalog/types';
import { reviewCardRequest } from '../lib/card-requests/actions';
import { CardDetailFields, readCardDetails } from './card-detail-fields';
import { CardSubmissionSummary } from './card-submission-summary';
import { requestStatusLabel } from './card-request-history';
export function AdminCardReview({
  request,
  draft,
  catalog,
}: {
  request: RequestSummary;
  draft?: CardDetails;
  catalog: CatalogSnapshot;
}) {
  const router = useRouter();
  const [result, setResult] = useState<RequestResult>();
  const [pending, start] = useTransition();
  const initial = draft ??
    request.submission_details ?? {
      card_name: request.card_name,
      issuer: request.issuer,
      comments: request.comments,
    };
  const duplicates = catalog.creditCards.filter(
    (c) =>
      c.issuer.trim().toLowerCase() === initial.issuer?.trim().toLowerCase() &&
      c.card_name.trim().toLowerCase() ===
        initial.card_name?.trim().toLowerCase(),
  );
  return (
    <>
      <p>Status: {requestStatusLabel[request.status]}</p>
      <details>
        <summary>Original submission</summary>
        <p>
          {request.card_name} · {request.issuer}
        </p>
        {request.reward_types.length ? (
          <p>Legacy reward categories: {request.reward_types.join(', ')}</p>
        ) : null}
        {request.submission_details ? (
          <CardSubmissionSummary
            details={request.submission_details}
            catalog={catalog}
          />
        ) : (
          <p>{request.comments || 'No additional details supplied.'}</p>
        )}
      </details>
      {request.status === 'pending' ? (
        <form
          className="card-request-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            const action = (
              event.nativeEvent as SubmitEvent
            ).submitter?.getAttribute('value') as
              'save' | 'publish' | 'link' | 'deny';
            if (!action) return;
            start(async () => {
              try {
                const response = await reviewCardRequest({
                  requestId: request.request_id,
                  revision: request.revision,
                  action,
                  details: readCardDetails(form),
                  note: String(data.get('decision_note') ?? ''),
                  cardId: Number(data.get('existing_card')),
                  verified: data.get('verified') === 'on',
                });
                setResult(response);
                if (response.ok) router.refresh();
              } catch {
                setResult({
                  ok: false,
                  code: 'persistence',
                  message: 'Unable to save. Please try again.',
                });
              }
            });
          }}
        >
          <h2>Review draft</h2>
          <p>
            Save incomplete details, or confirm the matching essentials and
            verify the official source before publishing.
          </p>
          <CardDetailFields
            initial={initial}
            filters={catalog.filters}
            categories={catalog.rewardCategories}
            errors={result && !result.ok ? result.fields : undefined}
            draft
          />
          <label className="card-request-form__checkbox">
            <input type="checkbox" name="verified" />I verified the final card
            facts and tags against the official source.
          </label>
          {duplicates.length ? (
            <p role="status">
              Possible existing card:{' '}
              {duplicates
                .map((c) => `${c.card_name} (#${c.card_id})`)
                .join(', ')}
              . Link an existing verified card to avoid duplicates.
            </p>
          ) : null}
          <label>
            Existing verified card
            <select name="existing_card" defaultValue="">
              <option value="">Choose a card to link</option>
              {catalog.creditCards
                .filter((c) => c.is_active && c.is_verified)
                .map((c) => (
                  <option key={c.card_id} value={c.card_id}>
                    {c.card_name} — {c.issuer}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Decision note (required for denial, visible to requester)
            <textarea name="decision_note" maxLength={2000} rows={3} />
          </label>
          {result ? (
            <p role={result.ok ? 'status' : 'alert'}>
              {result.ok ? 'Review saved.' : result.message}
            </p>
          ) : null}
          <div className="request-actions">
            <button
              type="submit"
              value="save"
              disabled={pending}
              className="secondary-action"
            >
              Save draft
            </button>
            <button
              type="submit"
              value="publish"
              disabled={pending}
              className="primary-action"
            >
              Accept and publish
            </button>
            <button
              type="submit"
              value="link"
              disabled={pending}
              className="secondary-action"
            >
              Accept with existing card
            </button>
            <button
              type="submit"
              value="deny"
              disabled={pending}
              className="secondary-action"
            >
              Deny request
            </button>
          </div>
        </form>
      ) : (
        <p>{request.decision_note ?? 'Review complete.'}</p>
      )}
    </>
  );
}
