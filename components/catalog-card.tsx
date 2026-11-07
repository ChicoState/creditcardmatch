'use client';

import type { CardMatch } from '../lib/catalog/rank-cards';
import type { CatalogCard } from '../lib/catalog/types';
import { ApplyLink } from './apply-link';
import { BookmarkButton } from './bookmark-button';
import { CompareButton } from './comparison-cart';

interface CatalogCardProps {
  card: CatalogCard;
  isAuthenticated: boolean;
  initialBookmarked: boolean;
  matchedLabels?: string[];
  cardMatch?: CardMatch;
  surveyMode?: boolean;
  showingBroaderOptions?: boolean;
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

export function CatalogCardView({
  card,
  isAuthenticated,
  initialBookmarked,
  matchedLabels = [],
  cardMatch,
  surveyMode = false,
  showingBroaderOptions = false,
}: CatalogCardProps) {
  const rating =
    cardMatch?.rating ??
    (showingBroaderOptions ? 'Broader option' : 'Review fit');

  return (
    <article className="result-card">
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
          <BookmarkButton
            cardId={card.cardId}
            cardName={card.cardName}
            initialBookmarked={initialBookmarked}
            isAuthenticated={isAuthenticated}
          />
          {surveyMode && (
            <span
              className={`match-label match-label-${rating
                .toLocaleLowerCase()
                .replaceAll(' ', '-')}`}
            >
              {rating}
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
        {surveyMode && cardMatch ? (
          <ul className="score-reasons">
            {cardMatch.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : (
          <p>
            {matchedLabels.length > 0
              ? `Matches every active filter: ${matchedLabels.join(', ')}.`
              : 'No filters are active, so this card is part of the blank-slate catalog.'}
          </p>
        )}
      </section>
      <ApplyLink card={card} />
      <CompareButton card={card} />
    </article>
  );
}
