export interface FilterRow {
  filter_id: number;
  slug: string;
  label: string;
  description: string | null;
}

export interface CreditCardRow {
  card_id: number;
  issuer: string;
  card_name: string;
  annual_fee: number;
  intro_offer: string | null;
  apply_url: string | null;
  is_active: boolean;
  image_url: string | null;
  description: string | null;
  reward_type: string | null;
  credit_level_required: string | null;
  source_url: string | null;
  last_verified_at: string | null;
  is_verified: boolean;
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
  cardFilters: CardFilterRow[];
  cardBenefits: CardBenefitRow[];
}

export interface CatalogCard {
  cardId: number;
  issuer: string;
  cardName: string;
  annualFee: number;
  imageUrl: string | null;
  description: string | null;
  rewardType: string | null;
  creditLevelRequired: string | null;
  isVerified: boolean;
  benefits: string[];
  filterSlugs: string[];
}
