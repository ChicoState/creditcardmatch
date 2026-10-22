# Spec: Credit Card Safety and Disclaimer Page

## Objective

Add a prominent, nonblocking `/disclaimer` page for U.S. visitors. It combines a formal site-boundary notice with plain-language warnings about common and severe credit-card risks. The site is informational only, earns no referral compensation, does not guarantee issuer decisions or outcomes, and does not provide legal, financial, tax, or credit-repair advice.

## Commands

- Focused test: `npm run test -- tests/app/legal-disclaimer.test.tsx`
- Quality checks: `npm run verify`
- Production build: `npm run build`
- Browser tests: `npm run test:e2e`

## Project Structure

- `app/disclaimer/page.tsx` — static legal and safety page
- `app/globals.css` — responsive presentation for warning cards and source list
- `app/layout.tsx` — global navigation entry point
- `app/page.tsx` and `app/results/page.tsx` — contextual entry points
- `tests/app/legal-disclaimer.test.tsx` — page and entry-point coverage
- `tests/e2e/catalog.spec.ts` — browser navigation coverage

## Code Style

Use server-rendered semantic HTML with one `h1`, descriptive `h2` sections, native lists, and direct links to authoritative government sources. Keep legal boundaries precise: use “may,” “can,” and “depending on applicable law” where outcomes vary.

## Testing Strategy

- Component-level tests verify the warning page, risk topics, non-advice boundary, independent-site statement, source links, and navigation entry points.
- Browser tests verify a visitor can open the page from home and results without an acknowledgment gate.
- Run formatting, linting, type checking, unit tests, coverage, smoke checks, and a production build before handoff.

## Boundaries

- Always: use U.S.-general language, cite authoritative sources, distinguish possibilities from guarantees, and keep the page nonblocking.
- Ask first: add state-specific legal advice, collect acknowledgment data, add dependencies, or change matching behavior.
- Never: promise that the disclaimer eliminates liability, imply that every debt leads to garnishment, or present personalized financial or legal advice.

## Success Criteria

- `/disclaimer` clearly identifies the site as independent and informational only.
- The page explains APR and interest, minimum payments, fees, penalty APRs, cash advances, balance transfers, credit impact, collections, lawsuits, conditional wage garnishment, identity theft, and bankruptcy.
- The page includes a few serious scenarios without sensational or state-specific claims.
- Prominent links exist in global navigation, the landing page, and recommendations.
- No acknowledgment or blocking interaction is required.

## Open Questions

None; audience, jurisdiction, tone, scope, and link behavior were confirmed in the interview.
