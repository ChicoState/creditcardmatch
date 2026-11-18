import Link from 'next/link';
import type { RequestSummary } from '../lib/card-requests/types';
export const requestStatusLabel = {
  pending: 'Pending',
  approved: 'Accepted',
  rejected: 'Denied',
};
export function CardRequestHistory({
  requests,
}: {
  requests: RequestSummary[];
}) {
  return requests.length ? (
    <ul className="admin-request-list">
      {requests.map((r) => (
        <li className="admin-request" key={r.request_id}>
          <div>
            <p className="eyebrow">{requestStatusLabel[r.status]}</p>
            <h2>{r.card_name}</h2>
            <p>
              {r.issuer} · Submitted{' '}
              {new Date(r.created_at).toLocaleDateString('en-US', {
                timeZone: 'UTC',
              })}
            </p>
            {r.decision_note ? <p>{r.decision_note}</p> : null}
            {r.catalog_card_id ? (
              <Link href={`/results#card-${r.catalog_card_id}`}>
                View accepted card in catalog
              </Link>
            ) : r.status === 'approved' ? (
              <p>
                Approved under the earlier review process; catalog publication
                has not been recorded.
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  ) : (
    <p>You haven’t submitted any card requests yet.</p>
  );
}
