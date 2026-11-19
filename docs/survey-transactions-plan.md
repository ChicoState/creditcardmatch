# Atomic saved-survey operations

## Confirmed outcome

For signed-in users, both saving and clearing survey answers must either commit
all changes or leave the prior data intact. Existing survey controls and
validation remain.

The implementation assumes one survey save or clear is in progress per account
at a time. Concurrent editing/saving from multiple tabs or devices is outside
scope. No explicit per-account locks, conflict detection, operation ordering,
or last-completed-operation guarantee is provided. Each individual RPC is still
transactional; this is not a guarantee that overlapping operations will leave
all survey representations consistent.

## Boundary and contract

- Add `save_survey_answers(p_submission jsonb)` and `clear_survey_answers()`
  PostgreSQL functions, called with the session client. Return `void` on success;
  a database error rolls back the complete RPC. The UI retains `SurveySaveResult`.
- Use `SECURITY INVOKER`, an empty search path, schema-qualified references,
  and EXECUTE permission for `authenticated` only. Derive the owner from
  `auth.uid()`; neither function accepts a user ID. Keep existing table RLS.
- Saving ensures the caller's profile exists inside the same transaction,
  without overwriting existing profile fields. Clearing does not create a
  profile or preference row when the user has never saved before.
- Saving updates the snapshot, timestamp, survey scalar fields, spending rows,
  and filter rows in the same transaction. Clearing nulls the existing survey
  fields and removes spending/filter rows in the same transaction. Preserve
  unrelated preference fields and the existing catalog slug-mapping behavior.
- Keep strict TypeScript input validation at the save action. The functions
  enforce authenticated ownership and database constraints; they do not add
  a second complete JSON schema or remove direct owner-scoped table access.
  Direct table writes remain outside these application operations.
- Use a database timestamp for saved answers. Revalidate account/survey
  pages only after a successful RPC. Return generic errors without SQL details.

## Ordered work and acceptance

1. Add failing action tests: one RPC per save/clear, expired-session rejection,
   controlled RPC errors, and no direct table mutations or success invalidation
   after failure. Keep malformed-input coverage.
2. Write the migration and replace the multi-request action implementations.
3. Add opt-in Vitest database integration tests using Docker/psql and a disposable
   database on the existing local Supabase PostgreSQL server. Copy only relevant
   table definitions/RLS and `auth.uid()`; never copy existing user records.
   Apply the draft migration only to that disposable database after review and
   authorization. Test real constraint/trigger failures.
4. Verify save/clear success, owner isolation, anonymous rejection, rollback after
   failures at each write stage, repeated sequential saves/clears, and clearing
   an account that has never saved. Always drop the test database.
5. Run repository quality checks and a production build. Existing browser flows
   against the shared local project require the reviewed migration there; do not
   apply it to that project or a remote project without separate authorization.

## Commands

- Action tests: `npm test -- tests/unit/survey-save-action.test.ts`
- Database tests: `RUN_DATABASE_TESTS=1 npm test -- tests/unit/survey-transactions.integration.test.ts`
- Quality baseline: `npm run verify`
- Production build: `NODE_ENV=production npm run build`
- Browser flow after approved project migration: `CI=1 NODE_ENV=production npm run test:e2e -- tests/e2e/saved-survey.spec.ts`

## Delivery and rollback

The migration is additive and does not change existing rows. Apply it through
the reviewed database workflow before deploying actions that call the new RPCs.
An unapplied migration must produce a failed operation, never a fallback to the
old partial-write path. Rolling back the application to the prior version leaves
the unused functions in place; re-enabling the old actions restores the old
consistency risk. No remote deployment is authorized by this implementation.

Card-request review, account deletion, rate limiting, and other audit findings
remain outside this change. The prior survey validation fix remains in force.

## Verification status

- The action tests failed in eight cases before switching to RPCs. All 17
  action tests now pass, including controlled failures and no direct writes.
- All 13 opt-in database tests passed on local PostgreSQL 17.6. They executed
  this migration only against copied schema definitions in a generated test
  database, verified real rollback behavior and authorization, and removed
  that database. No existing user records were copied or modified.
- The production build passed. The separate Next.js dependency remediation
  remains outside this change.
- `npm run verify` passed: formatting, lint, type checks, 247 unit/component
  tests, coverage thresholds, and Docker smoke checks with cleanup. The 13
  database tests are opt-in and were run separately, rather than counted as
  verified merely because the default suite skips them.
- Read-only review of the simplified implementation found no outstanding
  issues. `git diff --check` and the diff/new-file credential-pattern scan passed.
- The user confirmed applying the migration to local Supabase and manually
  testing save → clear → save, including refresh checks. Local manual browser
  verification is complete. This is user-reported manual evidence; the automated
  RPC-backed Playwright test has not been rerun following migration.
- Remote migration/deployment remains unverified and requires its own reviewed,
  authorized workflow. Apply the migration before deploying the new actions.
- Explicit locking and concurrent-operation tests were removed at the user's
  request. This implementation provides no concurrent-tab/device guarantee.

## Sources

- [PostgreSQL function security and search paths](https://www.postgresql.org/docs/17/sql-createfunction.html)
- [Supabase database functions](https://supabase.com/docs/guides/database/functions)
