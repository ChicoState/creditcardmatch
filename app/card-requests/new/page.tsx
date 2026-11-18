import Link from 'next/link';
import { CardRequestForm } from '../../../components/card-request-form';
import { getAuthenticatedUser } from '../../../lib/account/data';
import { getCatalogData } from '../../../lib/data/catalog';
export default async function NewCardRequestPage() {
  await getAuthenticatedUser('/card-requests/new');
  const catalog = await getCatalogData();
  return (
    <main className="page-shell narrow-page">
      <p className="eyebrow">Help grow the catalog</p>
      <h1>Request a missing card</h1>
      <p>An admin will verify the card details before publication.</p>
      <Link href="/account/card-requests">Your card requests</Link>
      <CardRequestForm
        filters={catalog.filters}
        rewardCategories={catalog.rewardCategories}
      />
    </main>
  );
}
