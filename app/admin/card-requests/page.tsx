import { AdminCardRequests } from '../../../components/admin-card-requests';
import { getAdminCardRequests } from '../../../lib/card-requests/admin-data';

export default async function AdminCardRequestsPage() {
  const requests = await getAdminCardRequests();

  return (
    <main className="page-shell narrow-page">
      <p className="eyebrow">Admin review</p>
      <h1>Card requests</h1>
      <p>Review requests before catalog data is added.</p>
      <AdminCardRequests requests={requests} />
    </main>
  );
}
