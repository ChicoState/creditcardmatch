import Link from 'next/link';
import { AdminCardReview } from '../../../../components/admin-card-review';
import { getReviewRequest } from '../../../../lib/card-requests/data';
import { getCatalogData } from '../../../../lib/data/catalog';
export default async function CardReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const review = await getReviewRequest(Number(id));
  const catalog = await getCatalogData();
  return (
    <main className="page-shell narrow-page">
      <Link href="/admin/card-requests">Back to card requests</Link>
      <h1>Review {review.request.card_name}</h1>
      <AdminCardReview
        key={review.request.revision}
        {...review}
        catalog={catalog}
      />
    </main>
  );
}
