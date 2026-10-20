# Spec: Card Comparison

Status: Scope and proposed defaults approved by the user on 2026-10-19.

## Objective

Let visitors add cards from the existing `/results` catalog to a comparison
cart, then open `/compare` to understand each card's strengths and costs side
by side. Use the existing visual design and the facts supplied by the team's
CSV exports.

## Proposed User Experience

- Each results card has an explicit “Add to compare” button. Once selected,
  the button becomes “Remove from comparison,” with an accessible pressed state.
- A persistent comparison cart displays the number of selected cards and their
  names. Clicking its cart link opens `/compare` directly. Individual remove
  controls remain separate from that link.
- Allow up to four unique cards, in selection order. At the limit, explain how
  to remove a card before adding another; existing selections remain removable.
- Keep selections when searching, changing filters, navigating between pages,
  or refreshing within the same browser tab. Store only card identifiers in
  session storage, with an in-memory fallback when storage is unavailable.
- On `/compare`, show each selected card as a column with aligned comparison
  rows. On narrow screens, allow the comparison region to scroll horizontally
  without making the entire page overflow.
- Show card name, issuer, verification status, description under “What it's good
  for,” reward type, category reward rates and their conditions, annual fee,
  first-year waiver, other fees, credit requirement, secured status and deposit,
  introductory offer, and benefits.
- Preserve percentage cashback versus points/miles-per-dollar units. Show caps,
  cap periods, rates after caps, and reward notes together with each rate.
  Compare categories in a consistent order across cards. A missing category
  rate means “Not listed”; do not infer it from a general purchase rate.
- Render unknown facts as “Not listed,” distinguish them from zero fees and
  explicit no-rewards cards, and show the recurring annual fee when a first-year
  waiver applies. Do not generate new financial claims or an overall winner.
- Allow removal and clearing from the compare page, and provide a link back to
  the catalog to add more cards. Zero selections shows an explanatory empty
  state; one selection shows its details and an invitation to add another.
- Ignore stale, inactive, duplicate, and malformed saved identifiers. If selected
  cards are no longer available, explain this and reconcile the cart count.

## Data and Technology

Use the existing Next.js App Router, React, TypeScript, CSS, and Supabase catalog
reader without adding dependencies or changing infrastructure decisions.

The CSV files in `data/card-catalog/` remain the card-fact source. They already
feed the generated Supabase seed. Application runtime continues to use
`getCatalogData()` and the active-card visibility policy rather than introducing
a second CSV-loading path.

`CatalogSnapshot` already contains reward categories, reward rates, introductory
offers, and benefits. `CatalogCard` currently omits reward rates and introductory
offers. Expose those facts through a comparison-specific projection or a small
compatible extension of the catalog presentation model, with tests proving the
join by card/category ID. Do not duplicate manually maintained card facts.

## Commands

Use host Node 24 and npm 11 as required by `AGENTS.md`. The inspected environment
has Node 24.21.0 and npm 12.0.2; use the required npm version for implementation
checks or report this prerequisite mismatch.

- Install: `npm ci`
- Development: `npm run dev`
- Unit and component tests: `npm run test`
- Coverage: `npm run coverage`
- Quality baseline: `npm run verify`
- Production compilation: `npm run build`
- Browser tests: `npm run test:e2e`
- Diff hygiene: `git diff --check`

Browser tests require the documented local Supabase stack and ignored local
environment configuration. No remote migrations or deployments are part of this
feature. Report unavailable prerequisites rather than claiming verification.

## Project Structure and Style

- `app/compare/page.tsx`: server catalog loading and comparison route.
- `components/`: client selection state, cart controls, and comparison display.
- `components/results-explorer.tsx`: per-card selection controls.
- `app/layout.tsx`: shared selection provider and cart access as needed.
- `lib/catalog/`: pure comparison data projection.
- `lib/storage/`: defensive session-storage helpers.
- `app/globals.css` or a comparison CSS module: responsive comparison styling.
- `tests/unit/`, `tests/app/`, `tests/e2e/`: logic, interaction, and browser coverage.

Follow existing named TypeScript exports, camelCase presentation fields,
Prettier formatting, semantic HTML, and native buttons/links. For example:

```tsx
<button
  aria-pressed={selected}
  onClick={() => toggleCard(card.cardId)}
  type="button"
>
  {selected ? 'Remove from comparison' : 'Add to compare'}
</button>
```

Use meaningful accessible names identifying the card, announce cart count
changes politely, and preserve visible keyboard focus.

## Testing Strategy

Write failing behavior tests before implementing selection and projection logic.
Vitest covers selection order, duplicates, the four-card limit, removal, clearing,
storage validation/failures, active-card resolution, reward joins and units, and
unknown-versus-zero values. React Testing Library covers add/remove controls,
cart navigation/count, limit feedback, and empty/single/multiple-card states.

Playwright covers adding two cards from results, opening the cart, comparing
their catalog facts, removing cards, refreshing, navigating back, and preserving
selections through filtering. Check keyboard access and a narrow viewport with
horizontal comparison scrolling. Keep existing catalog and survey tests passing
and retain the repository's configured coverage thresholds.

## Boundaries

- Always: use CSV-backed catalog facts, preserve visibility and verification
  labels, validate persisted data, test meaningful behavior, and review the diff
  for secrets and unintended changes.
- Ask first: change schema, dependencies, CI, infrastructure, account persistence,
  or the agreed comparison scope.
- Never: commit credentials or generated reports, infer missing financial facts,
  change the CSV dataset to make the UI work, or run remote migration, deployment,
  publishing, or release commands for this feature.

## Success Criteria

1. A visitor selects two different results cards, sees the cart count increase,
   and clicks the cart to view those same cards side by side at `/compare`.
2. Comparison descriptions, benefits, costs, and reward terms agree with the
   loaded CSV-backed catalog, including missing data and rate conditions.
3. Selection survives filtering, navigation, and same-tab refresh; removal,
   clearing, the four-card limit, and stale storage all behave predictably.
4. Desktop, mobile, and keyboard users can operate the full flow.
5. Applicable tests, static checks, build, and diff checks pass; any unavailable
   prerequisite is recorded explicitly.

## Open Items for Review

The four-card limit and same-tab persistence are proposed defaults. Review these
alongside the feature scope before implementation.
