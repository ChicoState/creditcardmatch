import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20261105120000_card_catalog_requests.sql',
  ),
  'utf8',
);

describe('card request migration', () => {
  it('stores authenticated requests with admin review controls and RLS', () => {
    expect(migration).toContain('CREATE TABLE public.app_admins');
    expect(migration).toContain('CREATE TABLE public.card_requests');
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.is_admin()');
    expect(migration).toContain(
      'ALTER TABLE public.card_requests ENABLE ROW LEVEL SECURITY',
    );
    expect(migration).toContain('Users can create their card requests');
    expect(migration).toContain('Admins can review card requests');
    expect(migration).toContain(
      "status IN ('pending', 'approved', 'rejected')",
    );
  });

  it('allows authenticated inserts to allocate request identity values', () => {
    expect(migration).toContain(
      'GRANT USAGE, SELECT ON SEQUENCE public.card_requests_request_id_seq TO authenticated',
    );
  });
});
