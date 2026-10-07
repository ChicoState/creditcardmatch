# Data Model Plan: Credit Card Match MVP

## Status

Approved for the Credit Card Match MVP. The migrations have been verified with a clean reset of the local CLI-managed Supabase stack; they have not been applied to a remote project. The open decisions below remain intentionally TBD at the application seam described for each item.

## Confirmed decisions

- Supabase Auth owns user identity and email.
- Landing, Survey, and Results are available without authentication.
- Authentication is required only to save survey answers.
- Names are not collected during MVP sign-up; profile name fields remain nullable.
- Immediately before saving survey answers, the application upserts the authenticated user's `profiles` row. The Auth trigger remains commented out as a possible future alternative.
- Filters are rows, not columns, so the filter vocabulary can grow without schema changes.
- Anonymous and authenticated users can read card-catalog data. Only trusted dashboard or service-role operations can write it.
- Authenticated users can read and mutate only their own saved profile and survey data. `recommendations` remains protected by the same owner-only rules but is unused in the MVP.

## Planned tables

| Area                 | Tables                                                               | Purpose                                                                                  |
| -------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Identity             | `auth.users`, `profiles`                                             | Supabase owns identity and email; `profiles` stores nullable application-specific names. |
| Card catalog         | `credit_cards`, `reward_categories`, `card_rewards`, `card_benefits` | Stores manually entered and verified card facts, rewards, and ordered benefits.          |
| Matching vocabulary  | `filters`, `card_filters`                                            | Stores extensible URL filter definitions and their many-to-many card assignments.        |
| Saved survey data    | `user_preferences`, `user_category_spend`, `user_filter_preferences` | Stores optional survey answers only for authenticated users.                             |
| Future saved results | `recommendations`                                                    | Reserved for saved recommendations after the MVP; no MVP flow reads or writes it.        |

All user references use the UUID from `auth.users` through `profiles.id`. Email is not duplicated in the public schema. All foreign keys have a supporting index, including indexes supplied by primary-key or unique constraints.

## Initial filter vocabulary

Only these confirmed filters are seeded:

- `popular-cards` — Popular Cards
- `cashback` — Cashback
- `new-to-credit` — New-to-Credit

## Migration strategy

The existing migration creates a bigint `public.users` table. The follow-up migration creates `profiles`, maps legacy users to `auth.users` by case-insensitive email, converts user-owned foreign keys to UUIDs, and removes `public.users`. It aborts if any legacy user does not map to exactly one Auth user, preventing silent loss or reassignment of user-owned data.

Repository history shows when the initial migration file was added, but contains no Supabase project configuration, migration-state artifact, or deployment record proving that it was applied. The team may prefer to rewrite the unapplied initial migration instead; that decision is intentionally deferred and the existing migration remains unchanged.

## Access model

- RLS is enabled on every public table.
- Catalog tables have `SELECT` policies for `anon` and `authenticated`; they have no client write policies.
- User-owned tables have owner-only `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies using `auth.uid()`.
- Survey answers remain ephemeral until a user signs in and explicitly saves them. Recommendation persistence is outside the MVP.
- Catalog status visibility is intentionally an application rule rather than an RLS rule: cards with `is_active = false` are hidden, while cards with `is_verified = false` remain visible with an `Unverified` label.

## Open decisions

- Should a future release replace application-driven profile upserts with an `auth.users` trigger, and which metadata keys should that trigger read?
- What values are allowed for `credit_cards.reward_type`?
- What values are allowed for `credit_cards.credit_level_required`?
- What values are allowed for `user_preferences.income_range`?
- What exact `credit_score_range` value represents no credit history?
- Does `user_preferences.monthly_spend` overlap with the category-level amounts in `user_category_spend`, and should it remain?
- Should `accepts_annual_fee` and `wants_travel_rewards` remain after `user_filter_preferences` is adopted?
- Has the initial migration been applied to any Supabase environment, and if so, does every legacy user email map uniquely to an Auth user?
