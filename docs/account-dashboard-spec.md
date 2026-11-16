# Spec: Account Dashboard

## Objective

Give signed-in users a private account dashboard where they can view their
email, review saved survey spending answers, and maintain a catalog-backed list
of cards they currently own.

## Scope

- Add an `Account` button to the signed-in navbar.
- Require authentication for `/account`; redirect signed-out visitors to
  `/login?next=/account`.
- Display the Auth email as read-only account information.
- Display saved survey category spending and monthly amounts.
- Manage a unique per-user “My Current Card Roster” using active catalog cards.
- Add cards through a searchable picker and remove cards with immediate removal
  plus an undo action.
- Keep the roster independent from matchmaking.

Manual card entry, email changes, password settings, direct editing of survey
answers, and matchmaking changes are out of scope.

## Data and security

- `user_card_roster` stores `(user_id, card_id)` with a composite primary key.
- Row-level policies permit authenticated users to read and mutate only their
  own roster rows.
- Dashboard reads and mutations verify the Supabase Auth user server-side.
- Survey answers remain locally available to anonymous users; signed-in survey
  submissions are also persisted to the existing owner-scoped survey tables so
  the account dashboard can show them across devices.

## Success criteria

- An authenticated user sees their email, spending summary, and current roster.
- A user can search active catalog cards, add each card at most once, and see
  its name, issuer, and rewards type.
- A user can remove a card immediately and undo that removal.
- An empty roster offers “Add your first card”.
- An unauthenticated request cannot read or mutate another user’s data.
- Existing matchmaking behavior remains unchanged.

## Verification

- Unit and component tests cover roster duplicate prevention, search, removal,
  undo, spending display, and authenticated navigation.
- Supabase migration tests verify the roster table, grants, and RLS policies.
- `npm run verify`, `npm run build`, and applicable Playwright coverage pass.
