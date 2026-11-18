import Link from 'next/link';
import { CardRequestHistory } from '../../../components/card-request-history';
import { getRequestHistory } from '../../../lib/card-requests/data';
export default async function CardRequestHistoryPage() {
  const requests = await getRequestHistory();
  return (
    <main className="page-shell narrow-page">
      <h1>Your card requests</h1>
      <Link className="primary-action" href="/card-requests/new">
        Request a missing card
      </Link>
      <CardRequestHistory requests={requests} />
    </main>
  );
}
