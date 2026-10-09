import type {
  CardBenefitRow,
  CardFilterRow,
  CatalogSnapshot,
  CreditCardRow,
  FilterRow,
} from '../../lib/catalog/types';

const filters: FilterRow[] = [
  {
    filter_id: 1,
    slug: 'popular-cards',
    label: 'Popular Cards',
    description: null,
  },
  {
    filter_id: 2,
    slug: 'cashback',
    label: 'Cashback',
    description: null,
  },
  {
    filter_id: 3,
    slug: 'new-to-credit',
    label: 'New-to-Credit',
    description: null,
  },
];

const creditCards: CreditCardRow[] = [
  {
    card_id: 10,
    issuer: 'Fictional Harbor Bank',
    card_name: 'Harbor Starter Card',
    annual_fee: 0,
    intro_offer: null,
    apply_url: null,
    is_active: true,
    image_url: null,
    description: 'A fictional starter card for unit tests.',
    reward_type: 'cashback',
    credit_level_required: 'no_history',
    source_url: null,
    last_verified_at: null,
    is_verified: false,
  },
  {
    card_id: 11,
    issuer: 'Fictional Aurora Credit Union',
    card_name: 'Aurora Everyday Card',
    annual_fee: 0,
    intro_offer: null,
    apply_url: null,
    is_active: true,
    image_url: null,
    description: 'A fictional everyday card for unit tests.',
    reward_type: 'cashback',
    credit_level_required: 'good',
    source_url: null,
    last_verified_at: '2026-09-01T00:00:00.000Z',
    is_verified: true,
  },
  {
    card_id: 12,
    issuer: 'Fictional Closed Bank',
    card_name: 'Closed Card',
    annual_fee: 0,
    intro_offer: null,
    apply_url: null,
    is_active: false,
    image_url: null,
    description: 'An inactive fictional card for unit tests.',
    reward_type: 'points',
    credit_level_required: 'good',
    source_url: null,
    last_verified_at: null,
    is_verified: true,
  },
];

const cardFilters: CardFilterRow[] = [
  { card_id: 10, filter_id: 2 },
  { card_id: 10, filter_id: 3 },
  { card_id: 11, filter_id: 1 },
  { card_id: 11, filter_id: 2 },
  { card_id: 12, filter_id: 1 },
];

const cardBenefits: CardBenefitRow[] = [
  {
    card_benefit_id: 100,
    card_id: 10,
    description: 'Second benefit',
    sort_order: 2,
  },
  {
    card_benefit_id: 101,
    card_id: 10,
    description: 'First benefit',
    sort_order: 1,
  },
];

export const catalogFixture: CatalogSnapshot = {
  filters,
  creditCards,
  cardFilters,
  cardBenefits,
};
