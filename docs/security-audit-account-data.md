# Security Audit: Account Information and Per-User Data

## Status

Current implementation review for the `security_audit` branch. Findings are
based on repository code and migrations; hosted Supabase, production proxy
behavior, deployment headers, and remote data were not independently verified.

## Date

2026-11-18

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
important open risks are incomplete privacy/deletion behavior, insufficiently
strict validation at the live Server Action boundary, a multi-step non-atomic
survey save, the missing explicit server-only guard for the service-role
module, and rate limiting that depends on deployment-specific proxy headers.

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

### 2. The live survey Server Action does not have a strict runtime schema

**Severity: High**

`saveSurveyAnswersAction` accepts attacker-controlled serialized input. Its
validator checks many values, but filter-preference arrays do not enforce all
expected cardinality and uniqueness rules, and malformed nested values can
throw during validation instead of producing a controlled rejection. The
database also stores the complete response in JSONB without equivalent shape
constraints. RLS proves ownership, not validity.

**Evidence:** [lib/account/actions.ts](../lib/account/actions.ts:277) and
[lib/config/survey.ts](../lib/config/survey.ts:35).

**Mitigations:**

- Use one strict runtime schema at the Server Action boundary with explicit
  object checks, array limits, duplicate rejection, enum validation, and
  numeric bounds.
- Return a generic validation result for malformed payloads; do not allow
  attacker-controlled shapes to cause uncaught exceptions.
- Keep the schema aligned with the catalog vocabulary, or resolve submitted
  slugs against current database rows and reject unknown values instead of
  silently dropping them.
- Add tests for malformed objects, duplicate filters, oversized arrays,
  non-finite numbers, unknown slugs, and incomplete category spending.
- Retain database checks for scalar tables as defense in depth.

### 3. Saved-survey persistence is multi-step and can become inconsistent

**Severity: Medium**

The action writes `user_preferences`, deletes and reinserts spending rows, then
deletes and reinserts filter rows. A later database failure can leave a saved
survey snapshot that does not match its relational spending or filter rows.

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

RLS correctly expresses the intended owner relationship, but it does not
prevent SQL injection, XSS/localStorage theft, invalid values, partial writes,
privacy failures, service-role misuse, or authentication abuse. Direct
authenticated clients can still attempt writes to their own rows, so server
validation and database constraints must remain defense in depth.

No current application SQL-injection path was identified. This conclusion
should be revalidated whenever new Server Actions, route handlers, RPCs, or
admin workflows are added.

## Recommended implementation order

1. Finalize the privacy/retention policy and implement account deletion,
   including avatar cleanup.
2. Add strict runtime schemas and malformed-input tests for every Server Action.
3. Make saved-survey persistence transactional.
4. Add the server-only guard and security-header policy.
5. Verify production proxy/IP behavior and add account-based throttling.
6. Tighten recommendation and admin-data policies before expanding those
   features.
7. Document and design account recovery before accounts become durable.

## Verification performed

- `npm run typecheck` passed.
- `npm test` passed: 39 test files and 174 tests.
- Repository inspection covered current application code, migrations, and
  tests; remote Supabase and production deployment behavior remain unverified.
