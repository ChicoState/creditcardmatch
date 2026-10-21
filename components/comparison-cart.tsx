'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import type { CatalogCard } from '../lib/catalog/types';
import { COMPARISON_LIMIT } from '../lib/storage/comparison-storage';
import { useComparison } from './comparison-provider';
import styles from './comparison.module.css';

function CartIcon() {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h3l3 13h11l3-10H6" />
      <circle cx="9" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
    </svg>
  );
}

export function ComparisonLink() {
  const { ids } = useComparison();
  return (
    <Link className={styles.cartLink} href="/compare">
      <CartIcon />
      <span>
        Compare <span className={styles.badge}>{ids.length}</span>
      </span>
    </Link>
  );
}

export function ComparisonCart({ cards }: { cards: CatalogCard[] }) {
  const { ids, ready, toggle, clear, reconcile, removedUnavailable } =
    useComparison();
  useEffect(() => {
    if (ready) reconcile(cards.map((card) => card.cardId));
  }, [cards, ready, reconcile]);
  const selected = ids.flatMap(
    (id) => cards.find((card) => card.cardId === id) ?? [],
  );

  return (
    <section aria-label="Comparison cart" className={styles.cart}>
      <div className={styles.cartHeading}>
        <Link className={styles.cartLink} href="/compare">
          <CartIcon />
          <span>
            Compare cards ({selected.length}/{COMPARISON_LIMIT})
          </span>
          <span aria-hidden="true">→</span>
        </Link>
        {selected.length > 0 && (
          <button className={styles.textButton} onClick={clear} type="button">
            Clear comparison
          </button>
        )}
      </div>
      <p className={styles.cartStatus} aria-live="polite">
        {selected.length === 0
          ? 'Choose cards below to see how they compare.'
          : `${selected.length} ${selected.length === 1 ? 'card' : 'cards'} selected for comparison.`}
      </p>
      {selected.length > 0 && (
        <ul className={styles.selectedCards}>
          {selected.map((card) => (
            <li key={card.cardId}>
              <span>{card.cardName}</span>
              <button
                aria-label={`Remove ${card.cardName} from comparison`}
                onClick={() => toggle(card.cardId)}
                type="button"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected.length === COMPARISON_LIMIT && (
        <p className={styles.cartStatus}>
          Your comparison is full. Remove a card to add another.
        </p>
      )}
      {removedUnavailable && (
        <p role="status" className={styles.cartStatus}>
          Some selected cards are no longer available and were removed.
        </p>
      )}
    </section>
  );
}

export function CompareButton({ card }: { card: CatalogCard }) {
  const { ids, toggle } = useComparison();
  const selected = ids.includes(card.cardId);
  return (
    <button
      aria-label={`${selected ? 'Remove from comparison' : 'Add to compare'}: ${card.cardName}`}
      aria-pressed={selected}
      className={styles.selectButton}
      disabled={!selected && ids.length >= COMPARISON_LIMIT}
      onClick={() => toggle(card.cardId)}
      type="button"
    >
      {selected ? '✓ Remove from comparison' : '+ Add to compare'}
    </button>
  );
}
