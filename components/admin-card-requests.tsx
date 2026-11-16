import { reviewCardRequestAction } from '../lib/account/actions';
import type { CardRequest } from '../lib/card-requests/types';

export function AdminCardRequests({ requests }: { requests: CardRequest[] }) {
  return requests.length > 0 ? (
    <ul className="admin-request-list">
      {requests.map((request) => (
        <li className="admin-request" key={request.request_id}>
          <div>
            <p className="eyebrow">{request.status}</p>
            <h2>
              {request.card_name} <span>by {request.issuer}</span>
            </h2>
            <p>Reward categories: {request.reward_types.join(', ')}</p>
            {request.notification_email ? (
              <p>Notify: {request.notification_email}</p>
            ) : null}
            {request.comments ? <p>Comments: {request.comments}</p> : null}
            <small>Requester: {request.user_id}</small>
          </div>
          {request.status === 'pending' ? (
            <div className="admin-request__actions">
              <form action={reviewCardRequestAction}>
                <input
                  name="request_id"
                  type="hidden"
                  value={request.request_id}
                />
                <input name="status" type="hidden" value="approved" />
                <button className="primary-action" type="submit">
                  Approve
                </button>
              </form>
              <form action={reviewCardRequestAction}>
                <input
                  name="request_id"
                  type="hidden"
                  value={request.request_id}
                />
                <input name="status" type="hidden" value="rejected" />
                <button className="secondary-action" type="submit">
                  Reject
                </button>
              </form>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  ) : (
    <p>No card requests are waiting for review.</p>
  );
}
