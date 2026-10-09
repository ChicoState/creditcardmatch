'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { filterCards, searchCards } from '../lib/catalog/filter-cards';
import { rankCards } from '../lib/catalog/rank-cards';
import type { CatalogCard, FilterRow } from '../lib/catalog/types';
import {
  addFilterSlug,
  buildResultsHref,
  removeFilterSlug,
} from '../lib/results/query-string';

interface ResultsExplorerProps {
  activeFilters: string[];
  cards: CatalogCard[];
  filters: FilterRow[];
}

export function ResultsExplorer({
  activeFilters,
  cards,
  filters,
}: ResultsExplorerProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const filterBySlug = useMemo(
    () => new Map(filters.map((filter) => [filter.slug, filter])),
    [filters],
  );
  const displayedCards = useMemo(() => {
    const filteredCards = filterCards(cards, activeFilters);
    const searchedCards = searchCards(filteredCards, searchTerm);
    return rankCards(searchedCards, {
      activeFilters,
      surveyAnswers: null,
    });
  }, [activeFilters, cards, searchTerm]);

  function navigateToFilters(nextFilters: string[]) {
    router.push(buildResultsHref(nextFilters), { scroll: false });
  }

  return (
    <>
      <div aria-label="Active filters" className="filter-chips">
        {activeFilters.length === 0 ? (
          <span className="no-filters">No filters selected</span>
        ) : (
          activeFilters.map((filterSlug) => (
            <span className="filter-chip" key={filterSlug}>
              {filterBySlug.get(filterSlug)?.label ?? filterSlug}
              <button
                aria-label={`Remove ${filterBySlug.get(filterSlug)?.label ?? filterSlug} filter`}
                onClick={() =>
                  navigateToFilters(removeFilterSlug(activeFilters, filterSlug))
                }
                type="button"
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      <div className="results-toolbar">
        <label className="search-control">
          <span aria-hidden="true">⌕</span>
          <span className="visually-hidden">Search cards</span>
          <input
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by card or issuer"
            type="search"
            value={searchTerm}
          />
        </label>

        <label className="filter-select">
          <span className="visually-hidden">Add a filter</span>
          <select
            aria-label="Add a filter"
            key={activeFilters.join(',')}
            onChange={(event) => {
              if (!event.target.value) return;
              navigateToFilters(
                addFilterSlug(activeFilters, event.target.value),
              );
            }}
            value=""
          >
            <option value="">+ Add filter</option>
            {filters.map((filter) => (
              <option
                disabled={activeFilters.includes(filter.slug)}
                key={filter.slug}
                value={filter.slug}
              >
                {filter.label}
              </option>
            ))}
          </select>
        </label>

        {/* TODO(TBD): Define the second results control. */}
        <button className="tbd-control" disabled type="button">
          Control TBD
        </button>
      </div>

      <p aria-live="polite" className="result-count">
        {displayedCards.length}{' '}
        {displayedCards.length === 1 ? 'match' : 'matches'}
      </p>

      {displayedCards.length === 0 ? (
        <section className="empty-state" role="status">
          <p className="eyebrow">No matches yet</p>
          <h2>Try removing a filter or changing your search.</h2>
          <p>The catalog has no active card matching every current choice.</p>
        </section>
      ) : (
        <div className="results-grid" id="cards">
          {displayedCards.map((card) => {
            const matchedLabels = activeFilters
              .filter((filterSlug) => card.filterSlugs.includes(filterSlug))
              .map(
                (filterSlug) =>
                  filterBySlug.get(filterSlug)?.label ?? filterSlug,
              );

            return (
              <article className="result-card" key={card.cardId}>
                <div
                  aria-label={`Illustration of ${card.cardName}`}
                  className="card-art"
                  role="img"
                >
                  <span>{card.issuer}</span>
                  <strong>{card.cardName}</strong>
                  <small>Fictional sample</small>
                </div>

                <div className="card-heading">
                  <div>
                    <p className="card-issuer">{card.issuer}</p>
                    <h2>{card.cardName}</h2>
                  </div>
                  {!card.isVerified && (
                    <span className="unverified-label">Unverified</span>
                  )}
                </div>

                <ul className="benefit-list">
                  {card.benefits.map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>
                <p className="card-description">{card.description}</p>

                <section className="recommendation-reason">
                  <h3>Why we recommend this</h3>
                  <p>
                    {matchedLabels.length > 0
                      ? `Matches every active filter: ${matchedLabels.join(', ')}.`
                      : 'No filters are active, so this card is part of the blank-slate catalog.'}
                  </p>
                </section>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
