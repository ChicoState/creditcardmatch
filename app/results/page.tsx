import { ResultsExplorer } from '../../components/results-explorer';
import { selectVisibleCatalogCards } from '../../lib/catalog/visibility';
import { getCatalogData } from '../../lib/data/catalog';
import { parseFilterSlugs } from '../../lib/results/query-string';

interface ResultsPageProps {
  searchParams: Promise<{ filters?: string | string[] }>;
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const [{ filters: filterQuery }, catalog] = await Promise.all([
    searchParams,
    getCatalogData(),
  ]);
  const activeFilters = parseFilterSlugs(filterQuery);
  const cards = selectVisibleCatalogCards(catalog);

  return (
    <main className="page-shell results-page">
      <header className="page-intro results-intro">
        <p className="eyebrow">Your current shortlist</p>
        <h1>Our Recommendations</h1>
        <p>
          All active filters combine with AND. Search narrows the matching cards
          further.
        </p>
      </header>
      <ResultsExplorer
        activeFilters={activeFilters}
        cards={cards}
        filters={catalog.filters}
      />
    </main>
  );
}
