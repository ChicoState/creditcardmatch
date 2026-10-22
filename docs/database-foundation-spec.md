# Spec: Preliminary Credit-Card Database Foundation

## Objective

Create a version-controlled Supabase/PostgreSQL foundation for the U.S.-only
Credit Card Match catalog. It must support a manually maintained catalog,
private signed-in user data, and reviewed starter cards without adding an
application UI, recommendation algorithm, or remote deployment.

Success means that a local Supabase reset can create the schema and seed the
same canonical categories, reward program, and two active cards every time.
Supabase Auth remains the sole owner of passwords and account identities.

## Tech Stack

- PostgreSQL migrations and seed data managed with the Supabase CLI already in
  `devDependencies`.
- Supabase Auth `auth.users` UUIDs plus public tables protected with RLS.
- Vitest verifies the committed migration and seed-data contract until a local
  Supabase test environment is configured.

## Commands

- Test: `npm run test -- tests/infrastructure/database-foundation.test.ts`
- Static checks: `npm run lint && npm run typecheck && npm run format:check`
- Local database verification after Docker and Supabase CLI are configured:
  `npx supabase db reset`

Do not run `supabase db push`, `supabase db reset --linked`, or any migration
command against a remote project from this feature.

## Project Structure

- `supabase/migrations/20260928120000_initial_schema.sql` - complete baseline
  schema, constraints, RLS policies, and the Auth-profile trigger.
- `supabase/seed.sql` - canonical categories, the cash-back reward program,
  and issuer-sourced starter cards for local development.
- `tests/infrastructure/database-foundation.test.ts` - static contract checks
  for the baseline migration and local seed data.
- `docs/decisions/ADR-001-supabase-card-catalog-data-model.md` - rationale for
  the identity, access, and catalog boundaries.

## Data Model

- `profiles` uses `auth.users(id)` as its UUID primary key and stores only
  display names and the manually assigned `is_admin` flag.
- `user_preferences`, `user_spending`, and `user_owned_cards` hold private
  matching inputs. Income supports either an exact annual amount or a range.
- `reward_categories`, `reward_programs`, `credit_cards`, and `card_rewards`
  form the shared catalog. A reward rate can define an optional fixed cap and
  its period. Rotating or activation-required terms are administrator notes.
- `recommendations` preserve their score, explanation, profile snapshot, and
  generated time. They are never updated to silently reflect later profile or
  catalog changes.

## Security and Access Boundaries

- Enable RLS and revoke default anonymous and authenticated grants on every
  public table before granting only necessary operations.
- Standard users can read active catalog records and access only rows tied to
  their own `auth.uid()`.
- The manually assigned administrator role is required for catalog writes.
  Client access cannot grant or alter that role.
- The database never stores card numbers, bank credentials, balances,
  transactions, or application credentials.
- Issuer URLs are stored as text only; this feature makes no server-side HTTP
  requests to them.

## Code Style

Use explicit `public.` and `auth.` qualifications in SQL and write one named
RLS policy per operation. Security-definer functions pin their search path.

```sql
create policy "users read their own preferences"
on public.user_preferences for select to authenticated
using ((select auth.uid()) = user_id);
```

## Testing Strategy

- The initial Vitest contract checks that the migration creates the required
  Auth-linked and catalog tables, enables RLS, and includes the seed contract.
- Once a local Supabase environment exists, run `npx supabase db reset` and
  add database tests for cross-user denial, administrator-only catalog writes,
  and source/review-date constraints.
- Do not claim remote or local database execution until the required Supabase
  environment is available.

## Boundaries

- Always: version schema changes, validate at database boundaries, preserve
  recommendation history, and record a source URL and review date per card.
- Ask first: run any remote migration, add login/UI/API routes, add a third
  party data feed, or store new personal-data categories.
- Never: commit credentials, write authentication secrets to public tables,
  store bank/card-account data, or delete discontinued cards.

## Success Criteria

- The baseline schema links public profiles to Supabase Auth UUIDs.
- RLS allows users to manage only their own data and blocks catalog writes for
  non-administrators.
- The local seed data contains active U.S. cards with official issuer URLs and
  review dates, including the verified no-credit-history additions.
- The schema supports category spending, owned-card status/dates, fixed reward
  caps, and append-only recommendation snapshots.
- Existing site-shell behavior remains unchanged.

## Open Questions

- The first real administrator must be marked manually after the target
  Supabase project exists; no administrator account is seeded.
- A future feature must choose the exact API/server-action contract and UI for
  editing the catalog and generating recommendations.
