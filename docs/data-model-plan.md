# Data Model Plan: Credit Card Match MVP

## Status

All migrations, including the card-detail migration, and the generated team catalog complete a clean local reset and are pending team review. No migration has been confirmed as applied to a remote project. The remaining open decisions below stay intentionally TBD at the application seam described for each item.

## Confirmed decisions

- Supabase Auth owns user identity and email.
- Landing, Survey, and Results are available without authentication.
- Authentication is required only to save survey answers.
- Names are not collected during MVP sign-up; profile name fields remain nullable.
- Immediately before saving survey answers, the application upserts the authenticated user's `profiles` row. The Auth trigger remains commented out as a possible future alternative.
- Filters are rows, not columns, so the filter vocabulary can grow without schema changes.
- Anonymous and authenticated users can read card-catalog data. Only trusted dashboard or service-role operations can write it.
- Authenticated users can read and mutate only their own saved profile and survey data. `recommendations` remains protected by the same owner-only rules but is unused in the MVP.
- `reward_type` uses `cashback`, `points`, `miles`, or `none`.
- Required credit level uses `none`, `fair`, `good`, or `excellent`. Saved credit-score range also permits `unsure`; `none` means no credit history, while `unsure` means the user does not know their score.
- Income range uses `under_40000`, `40001_to_60000`, `60001_to_80000`, `80001_to_100000`, or `over_100000`.
- A blank catalog spreadsheet cell means the fact is not confirmed and is imported as `NULL`, never zero.

## Planned tables

| Area                 | Tables                                                               | Purpose                                                                                  |
| -------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Identity             | `auth.users`, `profiles`                                             | Supabase owns identity and email; `profiles` stores nullable application-specific names. |
| Card catalog         | `credit_cards`, `reward_categories`, `card_rewards`, `card_benefits` | Stores manually entered and verified card facts, rewards, and ordered benefits.          |
| Matching vocabulary  | `filters`, `card_filters`                                            | Stores extensible URL filter definitions and their many-to-many card assignments.        |
| Saved survey data    | `user_preferences`, `user_category_spend`, `user_filter_preferences` | Stores optional survey answers only for authenticated users.                             |
| Future saved results | `recommendations`                                                    | Reserved for saved recommendations after the MVP; no MVP flow reads or writes it.        |

All user references use the UUID from `auth.users` through `profiles.id`. Email is not duplicated in the public schema. All foreign keys have a supporting index, including indexes supplied by primary-key or unique constraints.

`credit_cards` stores stable slugs, network and eligibility vocabulary, point value when known, confirmed recurring and one-time fees, secured-card details, and created/updated timestamps. `point_value_cents = NULL` means the value is unknown; future reward-based ranking must exclude that card from reward calculations. The current alphabetical ranking is unchanged.

`card_rewards.reward_rate` is a percentage for cashback (`3` means 3%) and units per dollar for points or miles (`3` means 3x). Reward value per dollar in cents is `reward_rate * point_value_cents`. Reward caps require both `spend_cap` and `cap_period`, or neither. The seeded reward-category vocabulary is `groceries`, `dining`, `gas`, `travel`, `streaming`, `online_shopping`, and `other`.

## Initial filter vocabulary

Only these confirmed filters are seeded:

- `popular-cards` — Popular Cards
- `cashback` — Cashback
- `new-to-credit` — New-to-Credit

## Migration strategy

The existing migration creates a bigint `public.users` table. The follow-up migration creates `profiles`, maps legacy users to `auth.users` by case-insensitive email, converts user-owned foreign keys to UUIDs, and removes `public.users`. It aborts if any legacy user does not map to exactly one Auth user, preventing silent loss or reassignment of user-owned data.

Repository history shows when the initial migration file was added, but contains no Supabase project configuration, migration-state artifact, or deployment record proving that it was applied. The team may prefer to rewrite the unapplied initial migration instead; that decision is intentionally deferred and the existing migration remains unchanged.

Card facts are maintained in the team spreadsheet and exported to `data/card-catalog/cards.csv`, `rewards.csv`, and `benefits.csv`. `npm run seed:generate` validates those files and replaces `supabase/seed.sql`; the generated SQL is never edited by hand. The importer ignores the Cards-tab workflow columns `entered_by` and `notes`; `is_verified` is the only verification field. It also applies the recorded team decision that `capital-one-platinum-secured` has `reward_type = 'none'`.

## Access model

- RLS is enabled on every public table.
- Catalog tables have `SELECT` policies for `anon` and `authenticated`; they have no client write policies.
- Catalog table grants remain `SELECT`-only for `anon` and `authenticated`, including after card-detail columns are added.
- User-owned tables have owner-only `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies using `auth.uid()`.
- Survey answers remain ephemeral until a user signs in and explicitly saves them. Recommendation persistence is outside the MVP.
- Catalog status visibility is intentionally an application rule rather than an RLS rule: cards with `is_active = false` are hidden, while cards with `is_verified = false` remain visible with an `Unverified` label.

## Open decisions

- Should a future release replace application-driven profile upserts with an `auth.users` trigger, and which metadata keys should that trigger read?
- Does `user_preferences.monthly_spend` overlap with the category-level amounts in `user_category_spend`, and should it remain?
- Should `accepts_annual_fee` and `wants_travel_rewards` remain after `user_filter_preferences` is adopted?
- Has the initial migration been applied to any Supabase environment, and if so, does every legacy user email map uniquely to an Auth user?
