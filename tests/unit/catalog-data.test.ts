import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}));

import { getCatalogData } from '../../lib/data/catalog';

const filters = [
  {
    filter_id: 41,
    slug: 'cashback',
    label: 'Cashback',
    description: 'Cash rewards.',
  },
];
const creditCards = [
  {
    card_id: 51,
    slug: 'test-cash-card',
    issuer: 'Test Fictional Bank',
    card_name: 'Test Cash Card',
    network: 'visa',
    point_value_cents: null,
    annual_fee: 0,
    annual_fee_waived_first_year: false,
    one_time_fee: null,
    monthly_fee: null,
    foreign_transaction_fee_percent: null,
    is_secured: false,
    security_deposit_min: null,
    intro_offer: null,
    apply_url: null,
    is_active: true,
    image_url: null,
    description: 'Database-backed test card.',
    reward_type: 'cashback',
    credit_level_required: 'good',
    source_url: null,
    last_verified_at: '2026-10-01T00:00:00+00:00',
    is_verified: true,
    created_at: '2026-10-01T00:00:00+00:00',
    updated_at: '2026-10-01T00:00:00+00:00',
  },
];
const rewardCategories = [
  {
    category_id: 71,
    category_name: 'Other',
    slug: 'other',
    display_order: 7,
  },
];
const cardRewards = [
  {
    card_reward_id: 81,
    card_id: 51,
    category_id: 71,
    reward_rate: 1,
    spend_cap: null,
    cap_period: null,
    rate_after_cap: null,
    notes: null,
  },
];
const cardFilters = [{ card_id: 51, filter_id: 41 }];
const cardBenefits = [
  {
    card_benefit_id: 61,
    card_id: 51,
    description: 'A test benefit',
    sort_order: 1,
  },
];

function createQueryClient(
  errorTable?:
    | 'filters'
    | 'credit_cards'
    | 'reward_categories'
    | 'card_rewards'
    | 'card_filters'
    | 'card_benefits',
  queryError: { code?: string; message: string } = {
    message: `Unable to query ${errorTable}`,
  },
) {
  const rowsByTable = {
    filters,
    credit_cards: creditCards,
    reward_categories: rewardCategories,
    card_rewards: cardRewards,
    card_filters: cardFilters,
    card_benefits: cardBenefits,
  };

  return {
    from: vi.fn((table: keyof typeof rowsByTable) => ({
      select: vi.fn(() => ({
        order: vi.fn(async () => ({
          data: errorTable === table ? null : rowsByTable[table],
          error: errorTable === table ? queryError : null,
        })),
      })),
    })),
  };
}

describe('getCatalogData', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'local-test-key';
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('reads the complete catalog snapshot from Supabase', async () => {
    const client = createQueryClient();
    createClientMock.mockReturnValue(client);

    await expect(getCatalogData()).resolves.toEqual({
      filters,
      creditCards,
      rewardCategories,
      cardRewards,
      cardFilters,
      cardBenefits,
    });
    expect(client.from.mock.calls.map(([table]) => table)).toEqual([
      'filters',
      'credit_cards',
      'reward_categories',
      'card_rewards',
      'card_filters',
      'card_benefits',
    ]);
  });

  it.each([
    ['42703', 'column credit_cards.slug does not exist'],
    ['42P01', 'relation credit_cards does not exist'],
    ['PGRST204', "Could not find the 'slug' column in the schema cache"],
  ])(
    'explains local schema drift for development error %s',
    async (code, message) => {
      vi.stubEnv('NODE_ENV', 'development');
      createClientMock.mockReturnValue(
        createQueryClient('credit_cards', { code, message }),
      );

      await expect(getCatalogData()).rejects.toThrow(
        `Unable to load credit_cards from Supabase. ${message} Your local database schema is out of date. Run \`npm run supabase:reset\`.`,
      );
    },
  );

  it('explains how to start unreachable local Supabase in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    createClientMock.mockReturnValue(
      createQueryClient('credit_cards', {
        message: 'TypeError: fetch failed',
      }),
    );

    await expect(getCatalogData()).rejects.toThrow(
      'Unable to load credit_cards from Supabase. TypeError: fetch failed Is local Supabase running? Run `npm run supabase:start`.',
    );
  });

  it('keeps catalog query errors generic in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    createClientMock.mockReturnValue(
      createQueryClient('credit_cards', {
        code: '42703',
        message: 'column credit_cards.slug does not exist',
      }),
    );

    await expect(getCatalogData()).rejects.toThrow(
      'Unable to load credit_cards from Supabase.',
    );
    await expect(getCatalogData()).rejects.not.toThrow(
      'column credit_cards.slug does not exist',
    );
  });

  it('requires local Supabase configuration', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    await expect(getCatalogData()).rejects.toThrow(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY is required.',
    );
    expect(createClientMock).not.toHaveBeenCalled();
  });
});
