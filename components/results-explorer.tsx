'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useSyncExternalStore } from 'react';

import { filterCards, searchCards } from '../lib/catalog/filter-cards';
import {
  cardsWithCategoryOverlap,
  getCardMatch,
  rankCards,
} from '../lib/catalog/rank-cards';
import type { CatalogCard, FilterRow } from '../lib/catalog/types';
import {
  loadSurveyAnswers,
  SURVEY_STORAGE_KEY,
} from '../lib/storage/survey-storage';
import {
  addFilterSlug,
  buildResultsHref,
  removeFilterSlug,
  type ResultsMode,
} from '../lib/results/query-string';
import { CompareButton, ComparisonCart } from './comparison-cart';

interface ResultsExplorerProps {
  activeFilters: string[];
  cards: CatalogCard[];
  filters: FilterRow[];
  mode?: ResultsMode;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatNetwork(network: CatalogCard['network']): string {
  if (network === 'amex') return 'American Express';
  if (!network) return 'Card details';
  return `${network[0].toUpperCase()}${network.slice(1)}`;
}

function subscribeToSurveyStorage() {
  return () => {};
}

function getBrowserSurveyStorageValue(): string | null {
  try {
    return window.localStorage.getItem(SURVEY_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerSurveyStorageValue(): null {
  return null;
}

export function ResultsExplorer({
  activeFilters,
  cards,
  filters,
  mode = 'browse',
}: ResultsExplorerProps) {
  const router = useRouter();
  const surveyMode = mode === 'survey';
  const [searchTerm, setSearchTerm] = useState('');
  const storedSurveyAnswers = useSyncExternalStore(
    subscribeToSurveyStorage,
    getBrowserSurveyStorageValue,
    getServerSurveyStorageValue,
  );
  const surveyAnswers = useMemo(
    () =>
      surveyMode && storedSurveyAnswers
        ? loadSurveyAnswers({
            getItem: () => storedSurveyAnswers,
            setItem: () => {},
            removeItem: () => {},
          })
        : null,
    [storedSurveyAnswers, surveyMode],
  );
  const filterBySlug = useMemo(
    () => new Map(filters.map((filter) => [filter.slug, filter])),
    [filters],
  );
  const searchedCards = useMemo(() => {
    const filteredCards = filterCards(cards, activeFilters);
    return searchCards(filteredCards, searchTerm);
  }, [activeFilters, cards, searchTerm]);
  const categoryMatchedCards = useMemo(
    () =>
      surveyMode && surveyAnswers
        ? cardsWithCategoryOverlap(searchedCards, surveyAnswers)
        : searchedCards,
    [searchedCards, surveyAnswers, surveyMode],
  );
  const showingBroaderOptions =
    surveyMode &&
    surveyAnswers !== null &&
    categoryMatchedCards.length === 0 &&
    searchedCards.length > 0;
  const displayedCards = useMemo(() => {
    const cardsToRank =
      categoryMatchedCards.length > 0 ? categoryMatchedCards : searchedCards;
    return rankCards(cardsToRank, {
      activeFilters,
      surveyAnswers,
    });
  }, [activeFilters, categoryMatchedCards, searchedCards, surveyAnswers]);

  function navigateToFilters(nextFilters: string[]) {
    router.push(buildResultsHref(nextFilters, mode), { scroll: false });
  }

  return (
    <>
      <ComparisonCart cards={cards} />
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
            const cardMatch = getCardMatch(card, {
              activeFilters,
              surveyAnswers,
            });
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
                  <small>{formatNetwork(card.network)}</small>
                </div>

                <div className="card-heading">
                  <div>
                    <p className="card-issuer">{card.issuer}</p>
                    <h2>{card.cardName}</h2>
                  </div>
                  <div className="card-labels">
                    {surveyMode && cardMatch.rating && (
                      <span
                        className={`match-label match-label-${cardMatch.rating
                          .toLocaleLowerCase()
                          .replaceAll(' ', '-')}`}
                      >
                        {cardMatch.rating}
                      </span>
                    )}
                    {!card.isVerified && (
                      <span className="unverified-label">Unverified</span>
                    )}
                  </div>
                </div>

                <dl className="card-details">
                  <div>
                    <dt>Annual fee</dt>
                    <dd>
                      {card.annualFeeWaivedFirstYear
                        ? '$0 first year'
                        : formatCurrency(card.annualFee)}
                    </dd>
                  </div>
                  {card.oneTimeFee !== null && card.oneTimeFee !== 0 && (
                    <div>
                      <dt>One-time fee</dt>
                      <dd>{formatCurrency(card.oneTimeFee)}</dd>
                    </div>
                  )}
                  {card.monthlyFee !== null && card.monthlyFee !== 0 && (
                    <div>
                      <dt>Monthly fee</dt>
                      <dd>{formatCurrency(card.monthlyFee)}</dd>
                    </div>
                  )}
                  {card.isSecured && (
                    <div>
                      <dt>Card type</dt>
                      <dd>
                        Secured
                        {card.securityDepositMin !== null &&
                          ` · ${formatCurrency(card.securityDepositMin)} minimum deposit`}
                      </dd>
                    </div>
                  )}
                  {card.rewardType === 'none' && (
                    <div>
                      <dt>Rewards</dt>
                      <dd>No rewards</dd>
                    </div>
                  )}
                </dl>

                <ul className="benefit-list">
                  {card.benefits.map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>
                <p className="card-description">{card.description}</p>

                <section className="recommendation-reason">
                  <h3>{surveyMode ? 'Why this rating' : 'Why we show this'}</h3>
                  {surveyMode ? (
                    <>
                      {showingBroaderOptions && (
                        <p className="broader-option-note">
                          Shown as a broader option because no selected-category
                          matches were available.
                        </p>
                      )}
                      <ul className="score-reasons">
                        {cardMatch.reasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p>
                      {matchedLabels.length > 0
                        ? `Matches every active filter: ${matchedLabels.join(', ')}.`
                        : 'No filters are active, so this card is part of the blank-slate catalog.'}
                    </p>
                  )}
                </section>
                <CompareButton card={card} />
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
