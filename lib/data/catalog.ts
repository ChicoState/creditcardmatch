import { createClient } from '@supabase/supabase-js';

import type {
  CardBenefitRow,
  CardFilterRow,
  CatalogSnapshot,
  CreditCardRow,
  FilterRow,
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

  const [filtersResult, creditCardsResult, cardFiltersResult, benefitsResult] =
    await Promise.all([
      supabase
        .from('filters')
        .select('filter_id, slug, label, description')
        .order('filter_id'),
      supabase
        .from('credit_cards')
        .select(
          'card_id, issuer, card_name, annual_fee, intro_offer, apply_url, is_active, image_url, description, reward_type, credit_level_required, source_url, last_verified_at, is_verified',
        )
        .order('card_id'),
      supabase
        .from('card_filters')
        .select('card_id, filter_id')
        .order('card_id'),
      supabase
        .from('card_benefits')
        .select('card_benefit_id, card_id, description, sort_order')
        .order('card_benefit_id'),
    ]);

  return {
    filters: rowsOrThrow<FilterRow>('filters', filtersResult),
    creditCards: rowsOrThrow<CreditCardRow>('credit_cards', creditCardsResult),
    cardFilters: rowsOrThrow<CardFilterRow>('card_filters', cardFiltersResult),
    cardBenefits: rowsOrThrow<CardBenefitRow>('card_benefits', benefitsResult),
  };
}
