import Link from 'next/link';
import type { RequestSummary } from '../lib/card-requests/types';
import { requestStatusLabel } from './card-request-history';
export function AdminCardRequests({
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
            <h2>
              <Link href={`/admin/card-requests/${r.request_id}`}>
                {r.card_name}
              </Link>
            </h2>
            <p>
              {r.issuer} ·{' '}
              {new Date(r.created_at).toLocaleDateString('en-US', {
                timeZone: 'UTC',
              })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  ) : (
    <p>No card requests match this view.</p>
  );
}
