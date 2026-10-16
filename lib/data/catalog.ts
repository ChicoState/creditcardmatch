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

interface SupabaseQueryError {
  code?: string;
  details?: string;
  hint?: string;
  message: string;
}

interface QueryResult<T> {
  data: T[] | null;
  error: SupabaseQueryError | null;
}

const SCHEMA_ERROR_CODES = new Set(['42703', '42P01']);
const LOCAL_SCHEMA_HINT =
  'Your local database schema is out of date. Run `npm run supabase:reset`.';
const LOCAL_CONNECTION_HINT =
  'Is local Supabase running? Run `npm run supabase:start`.';

function requireEnvironmentVariable(
  name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function errorDescription(error: SupabaseQueryError): string {
  return [error.message, error.details, error.hint]
    .filter((part): part is string => Boolean(part))
    .join(' ');
}

function isSchemaError(error: SupabaseQueryError): boolean {
  return (
    (error.code !== undefined && SCHEMA_ERROR_CODES.has(error.code)) ||
    error.code?.startsWith('PGRST2') === true ||
    /schema cache/iu.test(errorDescription(error))
  );
}

function isConnectionError(error: SupabaseQueryError): boolean {
  return /(?:failed to fetch|fetch failed|network(?:error| request failed)|connection refused|econnrefused|enotfound|load failed)/iu.test(
    errorDescription(error),
  );
}

function catalogQueryError(table: string, error: SupabaseQueryError): Error {
  const genericMessage = `Unable to load ${table} from Supabase.`;
  if (process.env.NODE_ENV === 'production') {
    return new Error(genericMessage, { cause: error });
  }

  const parts = [genericMessage, error.message];
  if (isSchemaError(error)) parts.push(LOCAL_SCHEMA_HINT);
  else if (isConnectionError(error)) parts.push(LOCAL_CONNECTION_HINT);

  return new Error(parts.join(' '), { cause: error });
}

function rowsOrThrow<T>(table: string, result: QueryResult<T>): T[] {
  if (result.error) {
    throw catalogQueryError(table, result.error);
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
