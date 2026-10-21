import Link from 'next/link';
import { ComparisonView } from '../../components/comparison-view';
import { selectComparisonCards } from '../../lib/catalog/comparison';
import { getCatalogData } from '../../lib/data/catalog';

export const dynamic = 'force-dynamic';

export default async function ComparePage() {
  const cards = selectComparisonCards(await getCatalogData());
  return (
    <main className="page-shell">
      <header className="page-intro">
        <p className="eyebrow">Your cards, side by side</p>
        <h1>Compare cards</h1>
        <p>Find the rewards, benefits, and costs that matter to you.</p>
        <Link className="text-link" href="/results">
          Back to all cards
        </Link>
      </header>
      <ComparisonView cards={cards} />
    </main>
  );
}
