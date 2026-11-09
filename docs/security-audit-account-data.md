# Security Audit: Account Information and Per-User Data

## Status

Audit report — current implementation review

## Date

2026-11-04

## Scope

This review covers account creation and login, browser-side survey storage,
the planned per-user Supabase tables, row-level security (RLS), and the
authentication rate limiter. It does not assess Supabase's hosted platform,
deployment configuration, or remote production data because the repository
states that the migrations have only been verified against the local stack.

## Executive summary

The application does not currently save true personal information such as a
person's legal name, phone number, physical address, or real email address.
Accounts use a pseudonymous username and a synthetic `.invalid` email address;
passwords are handled by Supabase Auth rather than stored in application
tables. The closest information to personal data is the survey's coarse
credit-score range, income range, spending amounts, and card preferences.
These attributes are not directly identifying, but they are still sensitive
in a financial context.

The database RLS design provides a reasonable owner boundary for future saved
survey data. RLS is an authorization control, not a SQL-injection defense and
not a substitute for input validation, privacy disclosure, or secure handling
of privileged credentials.

No current SQL-injection sink was found. Current catalog access uses the
Supabase query builder, and no application code was found that concatenates
user input into SQL. The largest risks are deferred to the Phase 2b save
workflow, localStorage exposure, privacy documentation, and operational trust
in forwarded client-IP headers.

## Data inventory and classification

| Data | Current location | Classification | Current behavior |
| --- | --- | --- | --- |
| Username | Supabase Auth user metadata and authentication flow | Pseudonymous account identifier | Collected during signup; not a legal identity by itself |
| Password | Supabase Auth | Authentication secret | Submitted to Supabase Auth; application does not store it in its own tables |
| Credit-score range | Browser localStorage; future user preferences table | Sensitive financial attribute, not direct PII | Used for matching; currently not saved server-side |
| Income range | Browser localStorage; future user preferences table | Sensitive financial attribute, not direct PII | Used for matching; currently not saved server-side |
| Monthly category spending | Browser localStorage; future category-spend table | Sensitive financial/behavioral attribute, not direct PII | Used for matching; currently not saved server-side |
| Card and reward preferences | Browser localStorage; future filter-preferences table | Preference/behavioral data | Used for matching; currently not saved server-side |
| First/last name | Optional `profiles` columns | Direct personal information if populated | Schema supports it, but the current signup form does not collect it |

The distinction matters: “not direct PII” does not mean “non-sensitive.” A
credit-score or income range can affect a person's financial profile, and a
combination of attributes can become identifying in a broader data set. The
current product should therefore describe these as sensitive survey or
financial-preference data, not as collected identity information.

## Findings and mitigations

### 1. Privacy notice and lifecycle policy are incomplete

**Severity: High before enabling saved accounts**

The `/legal` page is a credit-card disclaimer, not a data-use notice. It does
not explain the survey attributes collected, where they are stored, retention,
account deletion, or how a user can request removal. The current application
does not save survey answers to the database yet, but the schema is prepared
for that workflow.

**Evidence:** [app/legal/page.tsx](../app/legal/page.tsx),
[README.md](../README.md:3), and the user-owned tables in
[the database migration](../supabase/migrations/20260930120000_revise_credit_card_match_schema.sql:271).

**Possible mitigations:**

- Add a plain-language privacy notice before enabling server-side saving.
- State explicitly that credit-score range, income range, spending ranges, and
  preferences are collected for matching and are not used as an approval
  decision.
- Document storage location, retention period, deletion behavior, and whether
  anonymous localStorage data is retained until cleared.
- Add account deletion and survey-data deletion paths before launch.
- Keep the data model minimal; do not collect real names or contact details
  unless a future feature requires them.

### 2. RLS does not replace input validation or SQL-injection defenses

**Severity: High for the future save workflow**

RLS checks whether the authenticated user may access a row. It does not check
whether values are valid, safe, complete, or semantically allowed, and it does
not sanitize raw SQL. A future save action could still accept forged filter
slugs, invalid ranges, excessive values, or unsafe raw query fragments while
passing ownership checks.

**Evidence:** Owner predicates use `auth.uid()` in
[the database migration](../supabase/migrations/20260930120000_revise_credit_card_match_schema.sql:273).
Current catalog reads use the Supabase client in
[lib/data/catalog.ts](../lib/data/catalog.ts:81).

**Possible mitigations:**

- Validate every server-action or route payload with an explicit schema.
- Enforce allowed enum values, numeric bounds, maximum array lengths, and
  maximum string lengths in both application code and database constraints.
- Resolve filter and category slugs against database rows rather than trusting
  client-provided IDs or labels.
- Use the Supabase query builder or parameterized SQL exclusively; never build
  SQL by concatenating form values.
- Add integration tests proving that one authenticated user cannot read or
  mutate another user's rows and that malformed payloads are rejected.

### 3. Survey data in localStorage is readable by JavaScript on the origin

**Severity: Medium**

Anonymous survey responses are serialized into browser localStorage. This is
not a server breach and does not contain direct identity, but any successful
XSS or compromised script running in the origin could read the credit-score,
income, spending, and preference values.

**Evidence:** [lib/storage/survey-storage.ts](../lib/storage/survey-storage.ts:37).

**Possible mitigations:**

- Continue collecting only coarse ranges rather than exact income or exact
  financial-account data.
- Do not store passwords, tokens, or direct identifiers in localStorage.
- Add a Content Security Policy and maintain dependency/script controls.
- Provide a visible “clear survey data” action and clear anonymous data after a
  defined period if persistent cross-session matching is not required.
- If stronger confidentiality is required later, move persistence to an
  authenticated server-side store protected by RLS rather than treating
  client-side storage as a security boundary.

### 4. Privileged service-role client lacks an explicit server-only guard

**Severity: Medium**

The signup flow and rate limiter use a Supabase service-role client. It is
currently reached from server actions, and the key is read from an environment
variable. However, the module does not explicitly declare a server-only
boundary. A future client-side import could expose a privileged credential or
create an unsafe bundle.

**Evidence:** [lib/auth/server.ts](../lib/auth/server.ts:41) and
[lib/auth/actions.ts](../lib/auth/actions.ts:62).

**Possible mitigations:**

- Mark the privileged module as server-only using the framework-supported
  server-only guard.
- Keep the service-role key out of all `NEXT_PUBLIC_*` variables and browser
  bundles.
- Add a build or static check that fails if the service-role module is imported
  by client components.
- Prefer the anonymous/server-session client whenever an operation does not
  require administrative privileges.

### 5. Rate limiting depends on trusted proxy headers

**Severity: Medium, deployment-dependent**

The rate limiter uses the first `x-forwarded-for` value or `x-real-ip` value.
If the production edge does not overwrite or sanitize those headers, a caller
may spoof a new IP for each request and evade the ten-attempt bucket.

**Evidence:** [lib/auth/rate-limit.ts](../lib/auth/rate-limit.ts:7).

**Possible mitigations:**

- Confirm the production hosting provider's trusted client-IP behavior.
- Use only a platform-provided request IP after the trusted proxy boundary.
- Ignore client-supplied forwarding headers when the request did not come from
  a configured trusted proxy.
- Add account- and username-based throttling in addition to IP throttling,
  while preserving generic authentication errors.
- Consider CAPTCHA or progressive delays for repeated signup/login abuse.

### 6. Recommendation rows are writable by their owner

**Severity: Medium if recommendations become active**

The current policies allow a user to insert, update, and delete their own
recommendation rows. This is consistent with ownership, but it does not ensure
that recommendation scores and explanations were generated by trusted server
logic. The table is currently documented as unused by the MVP.

**Evidence:** [database migration](../supabase/migrations/20260930120000_revise_credit_card_match_schema.sql:315).

**Possible mitigations:**

- Keep recommendation creation in a trusted server action or service-role
  operation after validating the user's saved preferences.
- Remove client INSERT/UPDATE policies if recommendations are generated only
  by the server.
- Make generated recommendation snapshots immutable, or permit only deletion
  by the owner.
- Test that users cannot alter scores, explanations, or another user's
  recommendation rows.

### 7. Account recovery is not available for synthetic username accounts

**Severity: Medium product/security risk**

Usernames are encoded as synthetic `.invalid` email addresses and accounts are
automatically confirmed. This avoids collecting real email addresses, but it
also means users have no normal password-reset channel.

**Evidence:** [lib/auth/actions.ts](../lib/auth/actions.ts:62) sets
`email_confirm: true`; the authentication configuration disables confirmation
requirements in [supabase/config.toml](../supabase/config.toml:218).

**Possible mitigations:**

- Tell users clearly that the account has no email-based recovery.
- Offer an optional recovery email only with explicit consent, if the product
  later needs account recovery.
- Consider passkeys or another recovery mechanism before accounts become
  important to users.
- Add a controlled account deletion/recreation process that does not expose
  whether a username exists.

## RLS and injection conclusion

The current RLS policies correctly express the intended owner relationship:
`auth.uid()` must match the row owner. They are valuable defense-in-depth for
the future saved-data workflow.

They do not prevent:

- SQL injection in raw SQL or unsafe query construction;
- XSS or localStorage theft;
- accidental exposure through a service-role client;
- invalid or overbroad user-submitted values;
- privacy, retention, or deletion failures;
- abuse of authentication endpoints.

No current application SQL-injection path was identified during this review.
That conclusion should be revalidated when save handlers and server routes are
implemented.

## Recommended implementation order

1. Add the privacy notice, retention decision, and deletion requirements.
2. Add server-only enforcement and strict schemas before implementing saves.
3. Implement and integration-test owner isolation with real authenticated
   sessions.
4. Verify production proxy/IP behavior and strengthen rate limiting.
5. Decide whether recommendations are server-generated and tighten their
   policies accordingly.
6. Document the account-recovery trade-off for synthetic usernames.

