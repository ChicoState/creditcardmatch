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
    issuer: 'Test Fictional Bank',
    card_name: 'Test Cash Card',
    annual_fee: 0,
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
  errorTable?: 'filters' | 'credit_cards' | 'card_filters' | 'card_benefits',
) {
  const rowsByTable = {
    filters,
    credit_cards: creditCards,
    card_filters: cardFilters,
    card_benefits: cardBenefits,
  };

  return {
    from: vi.fn((table: keyof typeof rowsByTable) => ({
      select: vi.fn(() => ({
        order: vi.fn(async () => ({
          data: errorTable === table ? null : rowsByTable[table],
          error:
            errorTable === table
              ? { message: `Unable to query ${table}` }
              : null,
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
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('reads the complete catalog snapshot from Supabase', async () => {
    const client = createQueryClient();
    createClientMock.mockReturnValue(client);

    await expect(getCatalogData()).resolves.toEqual({
      filters,
      creditCards,
      cardFilters,
      cardBenefits,
    });
    expect(client.from.mock.calls.map(([table]) => table)).toEqual([
      'filters',
      'credit_cards',
      'card_filters',
      'card_benefits',
    ]);
  });

  it('fails closed when a catalog query fails', async () => {
    createClientMock.mockReturnValue(createQueryClient('credit_cards'));

    await expect(getCatalogData()).rejects.toThrow(
      'Unable to load credit_cards from Supabase.',
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
