import { redirect } from 'next/navigation';

import { CatalogCardView } from '../../components/catalog-card';
import { ComparisonCart } from '../../components/comparison-cart';
import { createAuthServerClient } from '../../lib/auth/server';
import { getBookmarkedCards } from '../../lib/bookmarks/data';
import { getCatalogData } from '../../lib/data/catalog';

export const dynamic = 'force-dynamic';

export default async function BookmarksPage() {
  const { data } = await (await createAuthServerClient()).auth.getUser();
  if (!data.user) {
    redirect(`/login?next=${encodeURIComponent('/bookmarks')}`);
  }

  const cards = await getBookmarkedCards(await getCatalogData());

  return (
    <main className="page-shell results-page">
      <header className="page-intro results-intro">
        <p className="eyebrow">Your saved shortlist</p>
        <h1>Bookmarked cards</h1>
        <p>Cards you save from the catalog will appear here.</p>
      </header>
      <ComparisonCart cards={cards} />
      {cards.length === 0 ? (
        <section className="empty-state" role="status">
          <p className="eyebrow">No saved cards yet</p>
          <h2>Keep a card handy for later.</h2>
          <p>
            Browse the card catalog and select Save on any card you want to
            revisit.
          </p>
        </section>
      ) : (
        <>
          <p aria-live="polite" className="result-count">
            {cards.length} {cards.length === 1 ? 'saved card' : 'saved cards'}
          </p>
          <div className="results-grid" id="cards">
            {cards.map((card) => (
              <CatalogCardView
                card={card}
                initialBookmarked
                isAuthenticated
                key={card.cardId}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
