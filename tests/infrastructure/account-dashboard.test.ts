import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20261103120000_user_card_roster.sql',
  ),
  'utf8',
);

describe('account dashboard roster migration', () => {
  it('uses an owner-scoped unique roster with RLS', () => {
    expect(migration).toContain('CREATE TABLE public.user_card_roster');
    expect(migration).toContain('PRIMARY KEY (user_id, card_id)');
    expect(migration).toContain(
      'ALTER TABLE public.user_card_roster ENABLE ROW LEVEL SECURITY',
    );
    expect(migration).toContain('Owners can update card roster entries');
    expect(migration).toContain('USING ((SELECT auth.uid()) = user_id)');
    expect(migration).toContain(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_card_roster TO authenticated',
    );
  });
});
