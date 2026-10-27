import type { CatalogCard } from '../lib/catalog/types';

export function isHttpsApplyUrl(
  url: string | null,
): url is `https://${string}` {
  return Boolean(url && url.trim() && url.startsWith('https://'));
}

export function ApplyLink({ card }: { card: CatalogCard }) {
  if (!isHttpsApplyUrl(card.applyUrl)) return null;

  return (
    <a
      aria-label={`Apply for ${card.cardName} on ${card.issuer}'s site (opens in a new tab)`}
      className="secondary-action apply-link"
      href={card.applyUrl}
      rel="noopener noreferrer"
      target="_blank"
    >
      Apply on {card.issuer}&apos;s site
    </a>
  );
}
