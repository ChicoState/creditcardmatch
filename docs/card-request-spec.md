# Spec: Card Catalog Requests

## Objective

Let authenticated Current Cards users request a missing card without adding
unverified data directly to the catalog. Store each request for admin review,
allow admins to approve or reject it, and retain an optional notification email
for a later delivery integration.

## User experience

- The Current Cards catalog initially shows at most 10 cards.
- A live, case-insensitive partial search checks card name and issuer.
- Search changes reset the visible list to the first 10 matching cards.
- “See more” reveals 10 additional matching cards per click.
- No matches show “No cards found” and “Can’t Find Your Card? Submit a Request”.
- The request form requires card name, issuer, and at least one existing reward
  category. Comments and notification email are optional.
- Requests are tied to the signed-in user and never insert catalog rows.

## Admin workflow

- Only users listed in `app_admins` can access `/admin/card-requests`.
- Admins can approve or reject pending requests.
- Approval records review metadata; actual catalog insertion remains a separate
  admin data operation.
- An optional email is retained for a future notification delivery worker.

## Commands

- Unit/component tests: `npm run test`
- Type check: `npm run typecheck`
- Formatting: `npm run format:check`
- Lint: `npm run lint`
- Full verification: `npm run verify`

## Boundaries

- Always: validate all form fields server-side, verify the signed-in user, and
  enforce admin access in both the page and server action.
- Ask first: remote migration application, email-provider integration, or new
  catalog data.
- Never: expose service-role credentials to the browser, trust client-supplied
  user IDs, or insert a requested card automatically.

## Success criteria

- Catalog rendering never shows more than 10 cards per page of results.
- Search, expansion, and empty-state behavior are covered by component tests.
- Authenticated users can submit valid requests and receive validation errors for
  invalid input.
- RLS limits request reads to the requester or an admin, and limits mutations to
  admins.
- Admins can approve or reject requests from the website.
- Non-admins are redirected away from the admin page and cannot invoke review
  actions successfully.
