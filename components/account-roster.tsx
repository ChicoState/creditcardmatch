'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import {
  addCardAction,
  removeCardAction,
  saveCardRosterAction,
} from '../lib/account/actions';
import type { CatalogCard } from '../lib/catalog/types';

interface AccountRosterProps {
  initialRoster: CatalogCard[];
  availableCards: CatalogCard[];
}

function rewardTypeLabel(rewardType: CatalogCard['rewardType']): string {
  if (!rewardType) return 'Rewards vary';
  return rewardType.charAt(0).toUpperCase() + rewardType.slice(1);
}

function cardFormData(cardId: number): FormData {
  const formData = new FormData();
  formData.set('card_id', String(cardId));
  return formData;
}

export function AccountRoster({
  initialRoster,
  availableCards,
}: AccountRosterProps) {
  const router = useRouter();
  const [roster, setRoster] = useState(initialRoster);
  const [recentlyRemoved, setRecentlyRemoved] = useState<CatalogCard | null>(
    null,
  );
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [draftCardIds, setDraftCardIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const catalogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCatalogOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsCatalogOpen(false);
    }

    function closeOnOutsideClick(event: MouseEvent) {
      if (
        catalogRef.current &&
        !catalogRef.current.contains(event.target as Node)
      ) {
        setIsCatalogOpen(false);
      }
    }

    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('mousedown', closeOnOutsideClick);
    };
  }, [isCatalogOpen]);

  function addCard(card: CatalogCard) {
    setError(null);
    startTransition(async () => {
      try {
        await addCardAction(cardFormData(card.cardId));
        setRoster((current) =>
          current.some((item) => item.cardId === card.cardId)
            ? current
            : [...current, card],
        );
        setRecentlyRemoved(null);
        router.refresh();
      } catch {
        setError('We could not add that card. Please try again.');
      }
    });
  }

  function removeCard(card: CatalogCard) {
    setError(null);
    setRoster((current) =>
      current.filter((item) => item.cardId !== card.cardId),
    );
    setRecentlyRemoved(card);
    startTransition(async () => {
      try {
        await removeCardAction(cardFormData(card.cardId));
        router.refresh();
      } catch {
        setRoster((current) => [...current, card]);
        setRecentlyRemoved(null);
        setError('We could not remove that card. Please try again.');
      }
    });
  }

  function undoRemoval() {
    if (!recentlyRemoved) return;
    const card = recentlyRemoved;
    setRecentlyRemoved(null);
    addCard(card);
  }

  function openCatalog() {
    setError(null);
    setDraftCardIds(new Set(roster.map((card) => card.cardId)));
    setIsCatalogOpen(true);
  }

  function toggleDraftCard(cardId: number) {
    setDraftCardIds((current) => {
      const next = new Set(current);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }

  function saveRoster() {
    const formData = new FormData();
    availableCards.forEach((card) => {
      if (draftCardIds.has(card.cardId))
        formData.append('card_id', String(card.cardId));
    });
    setError(null);
    startTransition(async () => {
      try {
        await saveCardRosterAction(formData);
        setRoster(
          availableCards.filter((card) => draftCardIds.has(card.cardId)),
        );
        setRecentlyRemoved(null);
        setIsCatalogOpen(false);
        router.refresh();
      } catch {
        setError('We could not update your card roster. Please try again.');
      }
    });
  }

  return (
    <section aria-label="Cards you have" className="account-section">
      <p className="eyebrow">Cards you have</p>

      {roster.length > 0 ? (
        <ul className="roster-list">
          {roster.map((card) => (
            <li className="roster-card" key={card.cardId}>
              <div>
                <h3>{card.cardName}</h3>
                <p>
                  {card.issuer} <span aria-hidden="true">·</span>{' '}
                  {rewardTypeLabel(card.rewardType)}
                </p>
              </div>
              <button
                className="text-button roster-card__remove"
                disabled={isPending}
                onClick={() => removeCard(card)}
                type="button"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="account-empty-state">
          <h3>Your roster is empty</h3>
          <p>
            Add the cards you currently use to keep your account up to date.
          </p>
        </div>
      )}

      {recentlyRemoved ? (
        <div aria-live="polite" className="account-undo">
          <span>{recentlyRemoved.cardName} removed.</span>
          <button className="text-button" onClick={undoRemoval} type="button">
            Undo
          </button>
        </div>
      ) : null}

      <div className="roster-add" id="add-card" ref={catalogRef}>
        <button
          className="primary-action"
          aria-expanded={isCatalogOpen}
          onClick={openCatalog}
          type="button"
        >
          Browse card catalog
        </button>
        {isCatalogOpen ? (
          <div aria-label="Card catalog" className="card-catalog" role="dialog">
            <div className="card-catalog__header">
              <div>
                <h2>Select your cards</h2>
                <p>Choose the cards you currently use.</p>
              </div>
              <button
                className="text-button"
                disabled={isPending}
                onClick={() => setIsCatalogOpen(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
            <div aria-label="Available cards" className="card-catalog__list">
              {availableCards.map((card) => {
                const isSelected = draftCardIds.has(card.cardId);
                return (
                  <button
                    aria-label={`${card.cardName}, ${isSelected ? 'selected' : 'not selected'}`}
                    aria-pressed={isSelected}
                    className={`card-catalog__item${isSelected ? ' card-catalog__item--selected' : ''}`}
                    key={card.cardId}
                    onClick={() => toggleDraftCard(card.cardId)}
                    type="button"
                  >
                    <span>{card.cardName}</span>
                    <small>{isSelected ? 'Selected' : 'Not selected'}</small>
                  </button>
                );
              })}
            </div>
            <button
              className="primary-action"
              disabled={isPending}
              onClick={saveRoster}
              type="button"
            >
              Done
            </button>
          </div>
        ) : null}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
    </section>
  );
}
