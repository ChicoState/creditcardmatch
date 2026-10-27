import type {
  CardBenefitRow,
  CardFilterRow,
  CardRewardRow,
  CatalogSnapshot,
  CreditCardRow,
  FilterRow,
  RewardCategoryRow,
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
    slug: 'no-credit-history',
    label: 'No Credit History',
    description: null,
  },
];

const creditCards: CreditCardRow[] = [
  {
    card_id: 10,
    slug: 'harbor-starter-card',
    issuer: 'Fictional Harbor Bank',
    card_name: 'Harbor Starter Card',
    network: 'mastercard',
    point_value_cents: null,
    annual_fee: 0,
    annual_fee_waived_first_year: true,
    one_time_fee: 25,
    monthly_fee: 5,
    foreign_transaction_fee_percent: null,
    is_secured: true,
    security_deposit_min: 49,
    intro_offer: null,
    apply_url: 'https://harbor.example/apply',
    is_active: true,
    image_url: null,
    description: 'A fictional starter card for unit tests.',
    reward_type: 'none',
    credit_level_required: 'none',
    source_url: null,
    last_verified_at: null,
    is_verified: false,
    created_at: '2026-10-01T00:00:00.000Z',
    updated_at: '2026-10-01T00:00:00.000Z',
  },
  {
    card_id: 11,
    slug: 'aurora-everyday-card',
    issuer: 'Fictional Aurora Credit Union',
    card_name: 'Aurora Everyday Card',
    network: 'visa',
    point_value_cents: null,
    annual_fee: 0,
    annual_fee_waived_first_year: false,
    one_time_fee: 0,
    monthly_fee: null,
    foreign_transaction_fee_percent: 0,
    is_secured: false,
    security_deposit_min: null,
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
    created_at: '2026-10-01T00:00:00.000Z',
    updated_at: '2026-10-01T00:00:00.000Z',
  },
  {
    card_id: 12,
    slug: 'closed-card',
    issuer: 'Fictional Closed Bank',
    card_name: 'Closed Card',
    network: null,
    point_value_cents: 1,
    annual_fee: 0,
    annual_fee_waived_first_year: false,
    one_time_fee: null,
    monthly_fee: null,
    foreign_transaction_fee_percent: null,
    is_secured: false,
    security_deposit_min: null,
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
    created_at: '2026-10-01T00:00:00.000Z',
    updated_at: '2026-10-01T00:00:00.000Z',
  },
];

const rewardCategories: RewardCategoryRow[] = [
  {
    category_id: 20,
    category_name: 'Other',
    slug: 'other',
    display_order: 7,
  },
];

const cardRewards: CardRewardRow[] = [
  {
    card_reward_id: 30,
    card_id: 11,
    category_id: 20,
    reward_rate: 1,
    spend_cap: null,
    cap_period: null,
    rate_after_cap: null,
    notes: null,
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
  rewardCategories,
  cardRewards,
  cardFilters,
  cardBenefits,
};
