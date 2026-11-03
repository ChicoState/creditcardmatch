import Link from 'next/link';

import { ResultsExplorer } from '../../components/results-explorer';
import { selectVisibleCatalogCards } from '../../lib/catalog/visibility';
import { SURVEY_FILTER_SLUGS } from '../../lib/config/survey';
import { getCatalogData } from '../../lib/data/catalog';
import { findMissingFilterSlugs } from '../../lib/results/missing-filters';
import {
  parseFilterSlugs,
  parseResultsMode,
} from '../../lib/results/query-string';

interface ResultsPageProps {
  searchParams: Promise<{
    filters?: string | string[];
    mode?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const [{ filters: filterQuery, mode: modeQuery }, catalog] =
    await Promise.all([searchParams, getCatalogData()]);
  const activeFilters = parseFilterSlugs(filterQuery);
  const mode = parseResultsMode(modeQuery);
  const cards = selectVisibleCatalogCards(catalog);
  const missingFilterSlugs =
    process.env.NODE_ENV === 'production'
      ? []
      : findMissingFilterSlugs(
          [...SURVEY_FILTER_SLUGS, ...activeFilters],
          catalog.filters,
        );

  return (
    <main className="page-shell results-page">
      <header className="page-intro results-intro">
        <p className="eyebrow">Your current shortlist</p>
        <h1>Our Recommendations</h1>
        <p>
          All active filters combine with AND. Search narrows the matching cards
          further.
        </p>
        <div className="results-links">
          <Link className="text-link" href="/learn">
            Learn credit card basics
          </Link>
          <Link className="text-link" href="/legal">
            Read the legal page
          </Link>
        </div>
      </header>
      <ResultsExplorer
        activeFilters={activeFilters}
        cards={cards}
        filters={catalog.filters}
        mode={mode}
        missingFilterSlugs={missingFilterSlugs}
      />
    </main>
  );
}
