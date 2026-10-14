export interface FilterRow {
  filter_id: number;
  slug: string;
  label: string;
  description: string | null;
}

export type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'discover';
export type RewardType = 'cashback' | 'points' | 'miles' | 'none';
export type CreditLevel = 'none' | 'fair' | 'good' | 'excellent';
export type RewardCapPeriod = 'month' | 'quarter' | 'year';

export interface CreditCardRow {
  card_id: number;
  slug: string;
  issuer: string;
  card_name: string;
  network: CardNetwork | null;
  point_value_cents: number | null;
  annual_fee: number;
  annual_fee_waived_first_year: boolean;
  one_time_fee: number | null;
  monthly_fee: number | null;
  foreign_transaction_fee_percent: number | null;
  is_secured: boolean;
  security_deposit_min: number | null;
  intro_offer: string | null;
  apply_url: string | null;
  is_active: boolean;
  image_url: string | null;
  description: string | null;
  reward_type: RewardType | null;
  credit_level_required: CreditLevel | null;
  source_url: string | null;
  last_verified_at: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface RewardCategoryRow {
  category_id: number;
  category_name: string;
  slug: string;
  display_order: number;
}

export interface CardRewardRow {
  card_reward_id: number;
  card_id: number;
  category_id: number;
  reward_rate: number;
  spend_cap: number | null;
  cap_period: RewardCapPeriod | null;
  rate_after_cap: number | null;
  notes: string | null;
}

export interface CardFilterRow {
  card_id: number;
  filter_id: number;
}

export interface CardBenefitRow {
  card_benefit_id: number;
  card_id: number;
  description: string;
  sort_order: number;
}

export interface CatalogSnapshot {
  filters: FilterRow[];
  creditCards: CreditCardRow[];
  rewardCategories: RewardCategoryRow[];
  cardRewards: CardRewardRow[];
  cardFilters: CardFilterRow[];
  cardBenefits: CardBenefitRow[];
}

export interface CatalogCard {
  cardId: number;
  slug: string;
  issuer: string;
  cardName: string;
  network: CardNetwork | null;
  pointValueCents: number | null;
  annualFee: number;
  annualFeeWaivedFirstYear: boolean;
  oneTimeFee: number | null;
  monthlyFee: number | null;
  foreignTransactionFeePercent: number | null;
  isSecured: boolean;
  securityDepositMin: number | null;
  imageUrl: string | null;
  description: string | null;
  rewardType: RewardType | null;
  creditLevelRequired: CreditLevel | null;
  isVerified: boolean;
  benefits: string[];
  filterSlugs: string[];
}
