# Security Audit: Account Information and Per-User Data

## Status

Current implementation review for the `security_audit` branch. Findings are
based on repository code, migrations, targeted validator probes, and a local
Supabase RLS probe. Hosted Supabase, production proxy behavior, deployment
headers, and remote data were not independently verified.

The dependency upgrade is complete locally and accepted by the user, including
user-reported Supabase start/reset coverage. See the
[compatibility report](dependency-upgrade.md). Card-request review controls
(finding 10) remain documented and outside the current implementation scope.
The next proposed review is finding 4, the privileged client's explicit
server-only boundary; no implementation for that finding has started.

## Date

2026-11-19 (follow-up to the 2026-11-18 review)

## Scope

This review covers authentication, account metadata, saved survey answers,
browser storage, avatars, bookmarks, card rosters, card requests, privileged
Supabase clients, server actions, rate limiting, and row-level security (RLS).
It also checks for SQL injection, XSS/unsafe URL handling, file-upload risks,
security headers, and data deletion gaps. It does not authorize applying
migrations or changing a remote Supabase project.

## Executive summary

The application uses Supabase Auth for passwords and stores the internal
service credential only through `SUPABASE_SERVICE_ROLE_KEY` at runtime. The
application does not intentionally collect a legal name, phone number, or
physical address during signup. It does, however, now persist sensitive
financial and behavioral data when a signed-in user saves survey answers:
credit-score and income ranges, category spending amounts, card preferences,
and the complete survey snapshot. Users may also provide an optional contact
email, avatar, card roster, bookmarks, and card-request comments.

The owner-scoped RLS policies are a useful authorization boundary, and no SQL
injection sink was found in the current application query paths. The most
important open risks are incomplete privacy/deletion behavior,
caller-controlled card-request review fields, the missing explicit
server-only guard for the service-role module, and rate limiting that depends
on deployment-specific proxy headers. The Next.js security upgrade is included in the locally verified dependency
upgrade; deployment remains unverified.
The shared survey runtime validator has now been hardened. Transactional
save/clear passed disposable-database tests, and the user confirmed local
migration application and manual browser verification. Remote rollout and
database shape constraints remain unverified or open.

## Data inventory and classification

| Data                              | Current location                                                             | Classification                                   | Current behavior                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Username and synthetic Auth email | Supabase Auth user metadata and Auth identity                                | Pseudonymous account identifier                  | Collected at signup; the synthetic email is not a recovery address                              |
| Password                          | Supabase Auth                                                                | Authentication secret                            | Submitted to Auth; not stored in application tables                                             |
| Contact email                     | Supabase Auth user metadata                                                  | Direct personal/contact information, unverified  | Optional account field; no verification or recovery workflow                                    |
| Credit-score and income ranges    | `user_preferences.survey_answers` and scalar columns; anonymous localStorage | Sensitive financial attributes                   | Saved server-side only after explicit signed-in save; also persisted anonymously in the browser |
| Monthly category spending         | `user_category_spend` and survey snapshot; anonymous localStorage            | Sensitive financial/behavioral data              | Owner-scoped when saved; coarse amounts are accepted                                            |
| Card and reward preferences       | `user_filter_preferences` and survey snapshot; anonymous localStorage        | Behavioral preference data                       | Owner-scoped when saved                                                                         |
| Avatar                            | Private Supabase Storage bucket plus Auth metadata path                      | Personal image data                              | Re-encoded to bounded WebP; signed URLs expire after one hour                                   |
| Bookmarks and card roster         | `bookmarks` and `user_card_roster`                                           | Account preference data                          | Owner-scoped through RLS                                                                        |
| Card requests                     | `card_requests`                                                              | User-submitted content and optional contact data | Authenticated users submit; admins can review                                                   |
| Profiles and recommendations      | `profiles` and reserved `recommendations` tables                             | User-owned account data                          | Profiles are used by current flows; recommendations remain unused                               |

“Not directly identifying” does not mean “non-sensitive.” A combination of
financial ranges, spending, preferences, contact email, and account metadata
can become identifying and should be handled as sensitive user data.

## Findings and mitigations

### 1. Privacy notice, retention, and account deletion are incomplete

**Severity: High before broad account use**

The `/legal` page now describes saved survey data, its purpose, browser
storage, and the current survey-clearing behavior. The remaining gap is that it
does not yet describe all other account data (optional contact email, avatars,
bookmarks, card rosters, and card requests), establish a finalized retention
schedule, or provide account deletion. `clearSurveyAnswersAction` now clears
the saved survey fields, related rows, and the anonymous browser survey key;
it intentionally does not delete the Auth account or other account data.

**Evidence:** [app/legal/page.tsx](../app/legal/page.tsx),
[lib/account/actions.ts](../lib/account/actions.ts:378),
[supabase/migrations/20261104120000_account_avatars.sql](../supabase/migrations/20261104120000_account_avatars.sql),
and [supabase/migrations/20261105120000_card_catalog_requests.sql](../supabase/migrations/20261105120000_card_catalog_requests.sql).

**Mitigations:**

- Expand the privacy notice to cover optional contact email, avatars,
  bookmarks, card rosters, and card requests.
- Replace the provisional retention wording with an approved retention
  schedule and document how users request removal.
- Add an account-deletion workflow that removes Auth metadata, private avatar
  objects, and all user-owned rows, with an explicit confirmation step.
- Keep the server and browser survey-clearing paths covered by regression tests.
- Keep optional contact email clearly separate from the internal Auth email
  and do not use it for recovery without verification and consent.

### 2. Survey runtime validation hardened locally

**Original severity: High. Application-layer fix implemented locally; not deployed.**

`saveSurveyAnswersAction` accepts attacker-controlled serialized input. Its
previous validator checked many values, but filter-preference arrays did not
enforce all expected cardinality and uniqueness rules, and malformed nested
values could throw instead of producing a controlled rejection. The
database also stores the complete response in JSONB without equivalent shape
constraints. RLS proves ownership, not validity.

**Evidence:** [lib/account/actions.ts](../lib/account/actions.ts:277) and
[lib/config/survey.ts](../lib/config/survey.ts:35).

**Local reproduction before the fix, 2026-11-19:** Starting with a valid payload produced by
`deriveSurveySubmission`, three separate probes containing a `null` spending,
card-filter, or user-filter row threw a `TypeError`. Three other probes were
accepted: duplicate user filters, no spending rows for a selected category,
and an unexpected top-level snapshot field. The valid control passed. These
were direct validator tests, not HTTP exploitation tests.

Before the fix, the action invoked this validator before its session check and persisted the
accepted object as `survey_answers` without projecting an allowlist of fields.
Thus malformed nested values could reject the action with an uncaught exception,
and an authenticated owner could store additional, unvalidated snapshot fields.
This does not demonstrate cross-user access or privilege escalation. The same
validator was used when loading saved answers, so malformed data written
directly by an owner could also interrupt account and survey rendering.

`lib/storage/survey-storage.ts` previously contained an unused, stricter-looking
`looksLikeSurveySubmission` helper. It has been removed; the browser loader,
saved-answer server readers, and save action all use `isSurveySubmission`.

**Implemented controls:**

- The action accepts `unknown` and rejects invalid input before authentication
  or database access, returning the existing generic validation error.
- The shared schema requires exact plain-object fields, validates each nested
  row before reading its fields, bounds array sizes, rejects sparse and
  duplicate entries, and validates enum values against the survey configuration.
- Every selected category must have exactly one finite positive spending
  amount, at most `99_999_999.99` to fit `DECIMAL(10,2)`.
- Card and user filter copies must agree regardless of ordering, and the two
  annual-fee flags must agree. Optional empty selections and both existing
  preference values remain supported.
- Saved-answer readers reject invalid stored snapshots as unavailable. Valid
  snapshots retain the existing shape and authenticated save behavior.
- Regression tests cover malformed objects, unexpected fields, duplicate and
  oversized arrays, sparse arrays, non-finite amounts, unknown slugs,
  incomplete spending, and action rejection before database access.

**Remaining boundaries:** Database shape constraints were not added. The
transactional save/clear follow-up is tracked in finding 3. Direct authenticated database clients can still store
invalid JSON on their own rows, although the application now declines to load
it. Some valid survey categories lack a relational catalog slug;
this fix validates the existing survey vocabulary and preserves that behavior.
Reworking catalog mappings remains outside the validation fix.

**Implementation scope, 2026-11-19:** Harden this survey boundary only. Use
`isSurveySubmission(value: unknown)` as the single runtime schema for the
Server Action and saved-answer readers. Require exact object fields, bounded
unique arrays of known values, complete selected-category spending with finite
positive amounts within the database range, matching card/user filter copies,
and consistent annual-fee flags. Preserve the existing optional empty category
and benefit selections and the `want`/`avoid` preference vocabulary. Invalid
saved data must load as unavailable rather than throw; valid payloads retain
the existing shape. No new dependency or database migration is needed.

Ordered implementation and acceptance checks:

1. Add failing Vitest tests for the shared schema and malformed Server Action
   inputs, proving invalid payloads cannot write data.
2. Harden the shared validator and remove the unused competing browser
   validator. Reject unknown slugs using the survey's defined vocabulary before
   any persistence. Preserve valid survey categories that have no relational
   catalog mapping; changing those mappings or the save transaction is outside
   this validation fix.
3. Run formatting, lint, type checks, the full unit/component suite and
   coverage, a production build, and the saved-survey Playwright flow. Update
   this finding with the outcome. Keep card-request review, transactionality,
   and other audit findings documented and unchanged.

### 3. Transactional survey save/clear verified locally

**Original severity: Medium. Remediated locally; remote rollout unverified.**

The previous action wrote `user_preferences`, deleted and reinserted spending rows, then
deleted and reinserted filter rows. A later database failure could leave a saved
survey snapshot that does not match its relational spending or filter rows.
Before the validation fix, duplicate filter slugs passed the validator but
conflicted with the relational `UNIQUE (user_id, filter_id)` constraint after
the old filters had been deleted. The hardened validator now rejects this
particular input before writes.

**Implemented:** Saving and clearing now each call a single
session-authenticated database function. The migration
`20261119120000_atomic_saved_survey.sql` moves their writes into PostgreSQL
transactions. The actions retain strict validation, check the current session,
return generic errors, and revalidate pages only after successful RPCs. The
functions use `SECURITY INVOKER`, derive ownership from `auth.uid()`, and retain
the existing RLS policies. No privileged service-role client is used.

All 13 opt-in integration tests passed against copied schema definitions in a
disposable local database, including injected failures at every survey write
stage, a late constraint failure that rolls back initial profile creation,
owner isolation, permission checks, repeated saves/clears, preservation of
unrelated fields, and a no-op clear before the first save. The disposable
database was removed. No existing user records were copied.

The user confirmed applying the migration to local Supabase and manually
testing save, clear, and save again, including page refresh checks. This
completes the local manual browser check. Subsequently, the dependency upgrade's
production build and all 24 Playwright tests passed against local Supabase,
including the saved-survey flow. The user's manual report remains separate
evidence from those automated results.
Remote migration/deployment remains unverified and requires its own reviewed,
authorized workflow. The migration must precede the updated actions in each
environment; absent RPCs produce controlled failures rather than partial writes.
Verification and project rollout are tracked in
[the implementation plan](survey-transactions-plan.md).

**Scope assumption:** Per the user's updated requirement, only one survey save
or clear is expected per account at a time. Explicit per-user locks, concurrent
tab/device handling, conflict detection, and last-completed-operation ordering
are outside this fix. The all-or-nothing guarantee applies to each individual
operation; overlapping operations are not guaranteed to leave all survey
representations consistent. Card-request review remains deferred.

**Evidence:** [lib/account/actions.ts](../lib/account/actions.ts:289).

**Mitigations:**

- Move the complete save into a transactional PostgreSQL function/RPC, or use
  another transactionally safe server-side boundary.
- Validate all rows before beginning the write.
- Add failure-injection/integration tests proving that a failed save leaves the
  previous complete version intact.

### 4. Privileged service-role client lacks an explicit server-only guard

**Severity: Medium**

`createAuthAdminClient` is currently reached from server actions, but the
module itself does not declare a framework server-only boundary. A future
client import could create an unsafe bundle or expose privileged behavior.

**Evidence:** [lib/auth/server.ts](../lib/auth/server.ts:41) and
[lib/auth/actions.ts](../lib/auth/actions.ts:62).

**Mitigations:**

- Add the framework-supported server-only guard to the privileged module.
- Keep the service-role key out of every `NEXT_PUBLIC_*` variable.
- Add a build/static check that rejects imports of the privileged module from
  client components.
- Use the session/anonymous client wherever administrative privileges are not
  required.

### 5. Authentication rate limiting trusts forwarding headers

**Severity: Medium, deployment-dependent**

The rate limiter uses the first `x-forwarded-for` value or `x-real-ip` value.
If the production edge does not overwrite and sanitize these headers, a caller
can spoof a new address for each request and evade the ten-attempt bucket. The
limiter also has no username/account-based bucket.

**Evidence:** [lib/auth/rate-limit.ts](../lib/auth/rate-limit.ts:7) and
[supabase/migrations/20261019120000_auth_rate_limits.sql](../supabase/migrations/20261019120000_auth_rate_limits.sql).

**Mitigations:**

- Confirm the production hosting provider's trusted client-IP behavior before
  deployment.
- Use only a platform-provided client IP after the trusted proxy boundary.
- Add username/account-based throttling and progressive delays while keeping
  authentication errors generic.
- Add abuse tests for spoofed headers and repeated attempts.

### 6. Security headers are not explicitly configured

**Severity: Medium**

No Content Security Policy, HSTS, frame-ancestors/X-Frame-Options,
X-Content-Type-Options, or related response-header policy was found in the
Next.js configuration. React escaping and the current lack of raw HTML reduce
XSS exposure, but they do not provide defense in depth against a future XSS,
unsafe third-party asset, or clickjacking scenario.

**Evidence:** [next.config.ts](../next.config.ts).

**Mitigations:**

- Add a tested header policy appropriate for local HTTP and production HTTPS.
- Start with `Content-Security-Policy`, `X-Content-Type-Options: nosniff`,
  frame protection, and production HSTS.
- Keep external image and connection sources narrowly allowlisted; review the
  policy whenever a new external asset or integration is added.

### 7. Recommendation rows are writable by their owner

**Severity: Medium if recommendations become active**

The `recommendations` table permits owner INSERT, UPDATE, and DELETE. That is
acceptable for unused storage, but it would let a client forge recommendation
scores or explanations if the table becomes user-visible without a policy
change.

**Evidence:** [supabase/migrations/20260930120000_revise_credit_card_match_schema.sql](../supabase/migrations/20260930120000_revise_credit_card_match_schema.sql:315).

**Mitigations:**

- Generate recommendation snapshots only in trusted server logic.
- Remove client INSERT/UPDATE policies if recommendations are derived data.
- Prefer immutable snapshots with owner deletion only, and test tamper
  resistance before activating the feature.

### 8. Account recovery is unavailable for synthetic username accounts

**Severity: Medium product/security risk**

Synthetic `.invalid` email identities and automatic confirmation mean users
have no normal password-reset channel. Username changes also update the
synthetic identity, so users should understand that the account can be lost if
the password is forgotten.

**Evidence:** [lib/auth/actions.ts](../lib/auth/actions.ts:62) and
[supabase/config.toml](../supabase/config.toml:218).

**Mitigations:**

- Disclose the recovery limitation during signup and in account settings.
- Offer an optional, explicitly consented and verified recovery email later,
  or evaluate passkeys/recovery codes.
- Provide a controlled account deletion/recreation path without exposing
  whether a username exists.

### 9. User-supplied contact email and card-request content need lifecycle controls

**Severity: Medium**

The optional contact email and card-request comments are accepted as
user-provided data and visible to administrators. Validation limits size and
format, and React output escaping is currently used, but there is no documented
retention period, redaction process, or admin audit trail. A future email
notification feature must not treat the unverified address as trusted.

**Evidence:** [lib/card-requests/validation.ts](../lib/card-requests/validation.ts),
[lib/account/actions.ts](../lib/account/actions.ts:420), and
[components/admin-card-requests.tsx](../components/admin-card-requests.tsx).

**Mitigations:**

- Document who can see these fields and how long they are retained.
- Treat contact email as unverified until an explicit verification flow exists.
- Add controlled deletion/redaction and security-event logging for admin
  review actions before the feature handles real production requests.

### 10. Requesters can forge card-request review status during INSERT

**Severity: Medium**

The authenticated INSERT policy checks only that `user_id = auth.uid()`.
Table-wide INSERT permission also allows the caller to supply `status`,
`reviewed_at`, and `reviewed_by`. The `pending` default does not prevent a
direct authenticated database API request from setting these fields.

**Evidence:**
[supabase/migrations/20261105120000_card_catalog_requests.sql](../supabase/migrations/20261105120000_card_catalog_requests.sql),
[lib/card-requests/admin-data.ts](../lib/card-requests/admin-data.ts), and
[components/admin-card-requests.tsx](../components/admin-card-requests.tsx).

**Local reproduction, 2026-11-19:** Inside a rollback transaction against the
existing local Supabase database, a temporary Auth user with `is_admin() = false`
switched to the `authenticated` role and successfully inserted an owned request
with `status = 'approved'`, a non-null `reviewed_at`, and its own UUID as
`reviewed_by`. The harness supplied a temporary explicit identity value using
`OVERRIDING SYSTEM VALUE` to avoid advancing the request sequence; the review
fields are otherwise ordinary insertable columns. The transaction rolled back
the temporary Auth user and request. No migration was applied.

The admin list reads these fields directly and hides review controls for
non-pending rows. A forged row can therefore appear already reviewed and skip
the normal review controls. This does not grant admin membership or create a
catalog card, but it compromises request workflow and review provenance.

**Mitigations:**

- Require `status = 'pending'`, `reviewed_at IS NULL`, and
  `reviewed_by IS NULL` in the authenticated INSERT policy, or grant INSERT
  only on requester-editable columns.
- Keep admin-only UPDATE authorization for review fields.
- Add database-level tests proving ordinary users cannot forge review state
  through direct inserts, while legitimate pending submissions and admin
  reviews continue to work.
- Apply any corrective migration only after the required review and explicit
  authorization; application validation alone cannot close this API path.

### 11. Next.js dependency upgraded locally

**Original severity: Moderate (npm advisory classification). Complete locally and accepted by the user; remote rollout unverified.**

The initial audit found Next.js 16.4.1 affected by two cache information-disclosure
advisories: [GHSA-mfr8-8qww-v76h](https://github.com/advisories/GHSA-mfr8-8qww-v76h)
and [GHSA-vc7v-qv4w-wrv8](https://github.com/advisories/GHSA-vc7v-qv4w-wrv8).
No `use cache` or `unstable_cache` usage was found in the application source;
exploitability in this application was not established.

The full dependency upgrade now installs Next.js and its ESLint configuration
at 16.4.6 and sets `experimental.agentUpgrade: 'security'`. Its clean install,
quality checks, production build, Docker smoke checks, 13 database tests, and
24 browser tests passed. The full dependency audit reports zero vulnerabilities.
See [the dependency compatibility report](dependency-upgrade.md) for the version
changes, TypeScript compatibility setup, and remaining toolchain constraints.

The earlier Next-only branch `fix/next-16.4.6-security-resumed` remains historical
local work. The full upgrade includes its version/configuration changes without
merging that branch. No remote migration, release, or deployment was performed;
the deployed dependency version has not been independently verified.

## Controls that are currently reasonable

- Supabase query-builder access is used for current application queries; no
  current SQL-concatenation injection path was found.
- User-owned table policies compare `auth.uid()` with the row owner and use
  `WITH CHECK` on writes.
- Avatar uploads are size/type checked, decoded with Sharp, pixel-limited,
  re-encoded to WebP, stored under the authenticated user's UUID folder, and
  served through expiring signed URLs.
- Card roster and bookmark actions derive the user ID from the session and
  validate catalog card IDs before writing.
- Authentication cookies are configured as `httpOnly`, `sameSite=lax`, and
  secure in production.
- No password, Auth token, or service-role key is written to localStorage.

## RLS and injection conclusion

Owner policies generally express the intended row ownership relationship, but
the card-request INSERT policy does not protect admin-controlled review fields.
RLS also does not prevent SQL injection, XSS/localStorage theft, invalid values,
partial writes, privacy failures, service-role misuse, or authentication abuse. Direct
authenticated clients can still attempt writes to their own rows, so server
validation and database constraints must remain defense in depth.

No current application SQL-injection path was identified. This conclusion
should be revalidated whenever new Server Actions, route handlers, RPCs, or
admin workflows are added.

## Recommended implementation order

1. Finalize the privacy/retention policy and implement account deletion,
   including avatar cleanup.
2. Add strict runtime schemas and malformed-input tests for every Server Action.
3. Prevent requester-supplied card-request review state at the database boundary.
4. Make saved-survey persistence transactional.
5. Add the server-only guard and security-header policy.
6. Verify production proxy/IP behavior and add account-based throttling.
7. Tighten recommendation and admin-data policies before expanding those
   features.
8. Document and design account recovery before accounts become durable.

Ensure the release includes the locally verified dependency upgrade and confirm
the deployed version after release.

## Verification performed

### Initial review, 2026-11-18

- `npm run typecheck` passed.
- `npm test` passed: 39 test files and 174 tests.
- Repository inspection covered current application code, migrations, and
  tests; remote Supabase and production deployment behavior remain unverified.

### Follow-up, 2026-11-19

- The existing legal-page and saved-survey clearing tests passed: two files,
  five tests. The pre-existing untracked saved-survey test was not modified.
- Temporary validator rejection probes reproduced all six issues described
  in finding 2: three exceptions and three accepted malformed payloads. The
  valid control passed. These deliberately failing probes stayed outside the
  repository test suite; they are evidence of open findings, not fixed tests.
- A local Supabase transaction confirmed the non-admin card-request INSERT
  bypass described in finding 10, then rolled back the probe records.
- `npm audit --omit=dev --json` reported one moderate affected production
  package on this branch, Next.js. It exited nonzero because the finding is
  open; the separate upgrade branch is recorded in finding 11.
- No application behavior, schema, remote project, or deployment was changed
  during this follow-up. Other findings retain their prior inspection status;
  this was not a complete rerun of all application or security checks.

### Survey validation implementation, 2026-11-19

- Added 64 regression and compatibility tests covering the runtime schema,
  save action, and browser saved-answer reader. Before the fix, 16 schema
  checks and five action checks failed, including uncaught exceptions and
  invalid payloads reaching writes. All now pass.
- `npm run verify` passed: formatting, ESLint, TypeScript, 41 test files with
  238 tests, coverage thresholds, and Docker smoke checks. Smoke containers,
  network, and named volumes were removed by the verification script.
- `CI=1 NODE_ENV=production npm run test:e2e -- tests/e2e/saved-survey.spec.ts
tests/e2e/catalog.spec.ts` passed its production build and all 12 browser
  tests against local Supabase. The known Next.js dependency reminder required
  the framework-supported immediate retry; the separate upgrade was not
  integrated as part of this validation change.
- `git diff --check` and the diff/new-test credential-pattern scan passed.
- No dependencies, migrations, card-request controls, other audit fixes, or
  remote environments were changed. The pre-existing untracked saved-survey
  clearing test remains untouched. Database JSON shape enforcement, relational
  catalog mapping, and transactional save/clear behavior remain separate work.

### Atomic survey save/clear implementation, 2026-11-19

- Saving and clearing now each use one owner-scoped, invoker-security RPC.
  Eight action tests failed against the old multi-request implementation; all
  17 action boundary/error tests now pass.
- `npm run verify` passed with 247 unit/component tests, coverage thresholds,
  formatting, lint, type checks, and Docker smoke checks with cleanup.
- All 13 database integration cases passed against a disposable schema-only
  copy on local PostgreSQL 17.6. These tests are opt-in and are skipped in the
  ordinary unit run. The test database was removed.
- The production build passed. Read-only review found no outstanding issues
  in the simplified implementation. Diff whitespace and credential-pattern
  checks passed.
- The single-operation-per-account assumption is documented in the saved-survey
  spec and implementation plan. Explicit locks and concurrent-operation tests
  were removed at the user's request; no simultaneous-tab/device guarantee is
  claimed.
- The user subsequently confirmed local migration application and successful
  manual save → clear → save testing with refresh checks. Local manual browser
  verification is complete. At that stage RPC-backed Playwright had not been
  rerun; the later dependency upgrade passed all 24 browser tests.
  Remote rollout remains unverified. Card-request controls were not changed.
