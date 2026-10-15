# Spec: Introductory Credit Card FAQ

## Objective

Replace the `/learn` placeholder with an introductory, educational credit-card FAQ. It helps visitors understand general card tradeoffs and vocabulary before or after they use the card matcher. The page must lead with a pros-and-cons table, followed by common terms and common questions. Every factual explanation links to a verified source from a government consumer-finance authority, a credit-card issuer, or a credit bureau.

## Tech Stack

- Next.js App Router and React, with TypeScript
- Existing global CSS design system
- Static server-rendered page; no database, authentication, or API changes

## Commands

- Test: `npm run test -- tests/app/home-page.test.tsx`
- Quality checks: `npm run verify`
- Production build: `npm run build`
- Browser tests: `npm run test:e2e`

## Project Structure

- `app/learn/page.tsx` — FAQ route and source-linked educational content
- `app/page.tsx` — bottom-of-home-page FAQ entry point
- `app/results/page.tsx` — FAQ entry point from recommendations
- `app/layout.tsx` — global navigation entry point
- `app/globals.css` — responsive FAQ presentation styles
- `tests/app/` — rendering and route-link tests

## Code Style

Use semantic HTML with a single `h1`, ordered `h2` sections, a real table for the comparison, a definition list for terms, and native `details`/`summary` elements for questions. External sources open in a new tab with a clear accessible label.

```tsx
<details>
  <summary>What is APR?</summary>
  <p>
    APR is the yearly cost of borrowing, expressed as a percentage.{' '}
    <a href={sourceUrl}>Read the CFPB explanation</a>.
  </p>
</details>
```

## Testing Strategy

- Add a component-level test that verifies the FAQ heading, pros-and-cons table, terms, questions, disclosure, verified-source links, and entry points.
- Extend browser coverage to prove that visitors can navigate from the home page and results page to `/learn`.
- Run the project quality checks and production build after the implementation.

## Boundaries

- Always: keep copy introductory, cite only eligible authorities, preserve accessible semantic structure, and test entry points.
- Ask first: add a dependency, change the database, alter matching behavior, or introduce product-specific recommendations.
- Never: cite AI-generated sites, publish financial advice, use affiliate links, or alter existing catalog data.

## Success Criteria

- `/learn` presents the requested three-part information architecture in the requested order.
- The page includes a short "educational information, not financial advice" notice.
- Each educational claim is directly supported by a link to CFPB, FTC, Experian, or an issuer source.
- The FAQ can be reached from matching results, the lower portion of the home page, and the global header navigation.
- The layout remains readable at mobile and desktop widths and passes the relevant automated checks.

## Open Questions

None. Content scope and audience were confirmed by the requester.
