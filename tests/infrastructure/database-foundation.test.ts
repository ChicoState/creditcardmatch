import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectFile = (path: string) => resolve(process.cwd(), path);

describe('database foundation', () => {
  const migration = readdirSync(projectFile('supabase/migrations'))
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => readFileSync(projectFile(`supabase/migrations/${file}`), 'utf8'))
    .join('\n');
  const seed = readFileSync(projectFile('supabase/seed.sql'), 'utf8');
  const publicTables = [
    ...migration.matchAll(/create table public\.([a-z_]+)/gi),
  ].map((match) => match[1]);

  it('links application profiles to Supabase Auth and enables RLS', () => {
    expect(migration).toMatch(
      /references auth\.users\(id\) on delete cascade/i,
    );
    expect(migration).toMatch(
      /alter table public\.profiles enable row level security/i,
    );
    expect(migration).toMatch(/create policy "owners can read profiles"/i);
    expect(migration).toMatch(/create policy "owners can create profiles"/i);
  });

  it('models the confirmed private data and catalog boundaries', () => {
    for (const table of [
      'profiles',
      'user_category_spend',
      'user_filter_preferences',
      'credit_cards',
      'card_rewards',
      'recommendations',
    ]) {
      expect(migration).toMatch(
        new RegExp(`create table (?:public\\.)?${table}\\b`, 'i'),
      );
    }

    expect(migration).toMatch(/source_url text/i);
    expect(migration).toMatch(/last_verified_at timestamptz/i);
    expect(migration).toMatch(/cap_period text/i);
    for (const table of publicTables) {
      expect(migration).toMatch(
        new RegExp(
          `alter table public\\.${table} enable row level security`,
          'i',
        ),
      );
    }
    expect(migration).not.toMatch(/disable row level security/i);

    for (const table of [
      'credit_cards',
      'card_rewards',
      'filters',
      'card_filters',
    ]) {
      expect(migration).not.toMatch(
        new RegExp(
          `create policy\\s+"[^"]+"\\s+on public\\.${table}\\s+for\\s+(?:insert|update|delete|all)\\b`,
          'i',
        ),
      );
    }
  });

  it('seeds the verified no-credit-history catalog additions', () => {
    expect(seed).toContain('Chase Freedom Unlimited');
    expect(seed).toContain('Quicksilver Secured');
    expect(seed).toContain(
      'https://creditcards.chase.com/cash-back-credit-cards/freedom/unlimited',
    );
    expect(seed).toContain(
      'https://www.capitalone.com/credit-cards/quicksilver-secured/',
    );
    expect(seed).toContain("'no-credit-history'");
    for (const cardName of [
      'Capital One Platinum',
      'Opensky Secured Visa',
      'Opensky Plus Secured Visa',
      'Opensky Launch Secured Visa',
      'First Progress Platinum Prestige Secured Mastercard',
      'First Progress Platinum Select Secured Mastercard',
      'Self Secured Visa Credit Card',
      'Chime Card',
      'Step Visa Card',
      'Current Build Card',
    ]) {
      expect(seed).toContain(cardName);
    }
    expect(seed.match(/2026-10-21/g)).toHaveLength(10);
  });
});
