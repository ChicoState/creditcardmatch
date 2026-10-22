import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectFile = (path: string) => resolve(process.cwd(), path);

describe('database foundation', () => {
  const migration = readFileSync(
    projectFile('supabase/migrations/20260928120000_initial_schema.sql'),
    'utf8',
  );
  const seed = readFileSync(projectFile('supabase/seed.sql'), 'utf8');

  it('links application profiles to Supabase Auth and enables RLS', () => {
    expect(migration).toContain('references auth.users(id) on delete cascade');
    expect(migration).toContain(
      'alter table public.profiles enable row level security',
    );
    expect(migration).toContain('create policy "users read their own profile"');
    expect(migration).toContain('create policy "administrators create cards"');
  });

  it('models the confirmed private data and catalog boundaries', () => {
    for (const table of [
      'user_preferences',
      'user_spending',
      'user_owned_cards',
      'reward_programs',
      'credit_cards',
      'card_rewards',
      'recommendations',
    ]) {
      expect(migration).toContain(`create table public.${table}`);
    }

    expect(migration).toContain('source_url text not null');
    expect(migration).toContain('last_reviewed_at timestamptz not null');
    expect(migration).toContain('cap_period text');
    expect(migration).toContain('profile_snapshot jsonb not null');
  });

  it('seeds the verified no-credit-history catalog additions', () => {
    expect(seed).toContain('Chase Freedom Unlimited');
    expect(seed).toContain('Capital One Quicksilver');
    expect(seed).toContain('https://creditcards.chase.com/');
    expect(seed).toContain('https://www.capitalone.com/credit-cards/');
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
