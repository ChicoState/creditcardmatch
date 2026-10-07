import Link from 'next/link';

import { LANDING_CATEGORY_FILTER_SLUGS } from '../lib/config/landing-categories';
import { getCatalogData } from '../lib/data/catalog';
import { buildResultsHref } from '../lib/results/query-string';

export default async function HomePage() {
  const { filters } = await getCatalogData();
  const filterBySlug = new Map(filters.map((filter) => [filter.slug, filter]));
  const landingCategories = LANDING_CATEGORY_FILTER_SLUGS.flatMap((slug) => {
    const filter = filterBySlug.get(slug);
    return filter ? [filter] : [];
  });

  return (
    <main className="page-shell landing-page">
      <section className="landing-hero" aria-labelledby="landing-heading">
        <p className="eyebrow">A clearer place to begin</p>
        <h1 id="landing-heading">Find the card that&apos;s right for you!</h1>
        <p className="landing-intro">
          Start with a category, answer a few questions, or browse every
          fictional sample card.
        </p>

        <div className="landing-choices">
          <section className="landing-column">
            <h2>Popular Categories:</h2>
            <div className="category-links">
              {landingCategories.map((filter) => (
                <Link
                  className="category-link"
                  href={buildResultsHref([filter.slug])}
                  key={filter.slug}
                >
                  <span aria-hidden="true" className="category-icon">
                    ◇
                  </span>
                  {filter.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="landing-column landing-survey-column">
            <h2>Take our survey for personalized recommendations:</h2>
            <Link className="primary-action" href="/survey">
              SURVEY
            </Link>
            <Link className="learn-link" href="/learn">
              Learn more about cards!
            </Link>
          </section>

          <section className="landing-column">
            <h2>Want a blank slate?</h2>
            <Link className="secondary-action" href="/results">
              START FRESH
            </Link>
          </section>
        </div>
      </section>
    </main>
  );
}
