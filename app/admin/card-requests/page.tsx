import Link from 'next/link';
import { AdminCardRequests } from '../../../components/admin-card-requests';
import { getReviewQueue } from '../../../lib/card-requests/data';
export default async function AdminCardRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = ['pending', 'approved', 'rejected', 'all'].includes(
    params.status ?? '',
  )
    ? params.status!
    : 'pending';
  const page = Math.max(
    1,
    Math.min(100000, Number.parseInt(params.page ?? '1', 10) || 1),
  );
  const q = typeof params.q === 'string' ? params.q.slice(0, 100) : '';
  const { requests, total } = await getReviewQueue(status, q, page);
  function href(next: number) {
    return `/admin/card-requests?${new URLSearchParams({ status, q, page: String(next) })}`;
  }
  return (
    <main className="page-shell narrow-page">
      <p className="eyebrow">Admin review</p>
      <h1>Card requests</h1>
      <form className="card-request-form">
        <label>
          Status
          <select name="status" defaultValue={status}>
            {[
              ['pending', 'Pending'],
              ['approved', 'Accepted'],
              ['rejected', 'Denied'],
              ['all', 'All'],
            ].map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Search card name or issuer
          <input name="q" type="search" maxLength={100} defaultValue={q} />
        </label>
        <button type="submit" className="secondary-action">
          Filter requests
        </button>
      </form>
      <AdminCardRequests requests={requests} />
      <nav aria-label="Request pages">
        {page > 1 ? <Link href={href(page - 1)}>Previous page</Link> : null}
        <span>
          {' '}
          Page {page} · {total} requests{' '}
        </span>
        {page * 25 < total ? (
          <Link href={href(page + 1)}>Next page</Link>
        ) : null}
      </nav>
    </main>
  );
}
