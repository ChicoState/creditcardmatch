import { createClient } from '@supabase/supabase-js';

import type {
  CardBenefitRow,
  CardFilterRow,
  CardRewardRow,
  CatalogSnapshot,
  CreditCardRow,
  FilterRow,
  RewardCategoryRow,
} from '../catalog/types';

interface QueryResult<T> {
  data: T[] | null;
  error: { message: string } | null;
}

function requireEnvironmentVariable(
  name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function rowsOrThrow<T>(table: string, result: QueryResult<T>): T[] {
  if (result.error) {
    throw new Error(`Unable to load ${table} from Supabase.`, {
      cause: result.error,
    });
  }

  return result.data ?? [];
}

export async function getCatalogData(): Promise<CatalogSnapshot> {
  const supabase = createClient(
    requireEnvironmentVariable('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnvironmentVariable('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );

  const [
    filtersResult,
    creditCardsResult,
    rewardCategoriesResult,
    cardRewardsResult,
    cardFiltersResult,
    benefitsResult,
  ] = await Promise.all([
    supabase
      .from('filters')
      .select('filter_id, slug, label, description')
      .order('filter_id'),
    supabase
      .from('credit_cards')
      .select(
        'card_id, slug, issuer, card_name, network, point_value_cents, annual_fee, annual_fee_waived_first_year, one_time_fee, monthly_fee, foreign_transaction_fee_percent, is_secured, security_deposit_min, intro_offer, apply_url, is_active, image_url, description, reward_type, credit_level_required, source_url, last_verified_at, is_verified, created_at, updated_at',
      )
      .order('card_id'),
    supabase
      .from('reward_categories')
      .select('category_id, category_name, slug, display_order')
      .order('display_order'),
    supabase
      .from('card_rewards')
      .select(
        'card_reward_id, card_id, category_id, reward_rate, spend_cap, cap_period, rate_after_cap, notes',
      )
      .order('card_reward_id'),
    supabase.from('card_filters').select('card_id, filter_id').order('card_id'),
    supabase
      .from('card_benefits')
      .select('card_benefit_id, card_id, description, sort_order')
      .order('card_benefit_id'),
  ]);

  return {
    filters: rowsOrThrow<FilterRow>('filters', filtersResult),
    creditCards: rowsOrThrow<CreditCardRow>('credit_cards', creditCardsResult),
    rewardCategories: rowsOrThrow<RewardCategoryRow>(
      'reward_categories',
      rewardCategoriesResult,
    ),
    cardRewards: rowsOrThrow<CardRewardRow>('card_rewards', cardRewardsResult),
    cardFilters: rowsOrThrow<CardFilterRow>('card_filters', cardFiltersResult),
    cardBenefits: rowsOrThrow<CardBenefitRow>('card_benefits', benefitsResult),
  };
}
