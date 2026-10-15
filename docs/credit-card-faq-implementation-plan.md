# Implementation Plan: Introductory Credit Card FAQ

## Overview

Deliver a static, source-linked FAQ at the existing `/learn` route and add clear entry points without changing matching logic or data.

## Architecture Decisions

- Reuse `/learn` because it is an existing learning destination, avoiding an unnecessary second education route.
- Keep sources beside the related term or answer so readers can check each claim in context.
- Use native disclosure elements for questions: they work without client-side state and provide keyboard-accessible progressive disclosure.

## Task List

### Task 1: Establish FAQ content and rendering test

**Acceptance criteria:**

- A test specifies the requested sections, disclosure, source links, and home/results entry points.
- The test fails while `/learn` is still a placeholder.

**Verify:** `npm run test -- tests/app/credit-card-faq.test.tsx`

**Dependencies:** None

**Files:** `tests/app/credit-card-faq.test.tsx`

### Task 2: Build the FAQ page

**Acceptance criteria:**

- `/learn` contains the pros-and-cons comparison, glossary, common questions, disclosure, and eligible citations.
- Content uses semantic headings, table, definition list, and disclosures.

**Verify:** `npm run test -- tests/app/credit-card-faq.test.tsx`

**Dependencies:** Task 1

**Files:** `app/learn/page.tsx`, `app/globals.css`

### Task 3: Add FAQ entry points

**Acceptance criteria:**

- Home, results, and global header expose a link to `/learn`.
- Existing journeys retain their current destinations.

**Verify:** `npm run test -- tests/app/credit-card-faq.test.tsx`

**Dependencies:** Task 2

**Files:** `app/page.tsx`, `app/results/page.tsx`, `app/layout.tsx`, `app/globals.css`

### Task 4: Verify navigation in a browser

**Acceptance criteria:**

- Browser tests navigate to the FAQ from home and results.
- The page is responsive and has no console errors.

**Verify:** `npm run test:e2e`, `npm run verify`, `npm run build`

**Dependencies:** Tasks 1-3

**Files:** `tests/e2e/catalog.spec.ts`

## Risks and Mitigations

| Risk                                         | Impact | Mitigation                                                                                    |
| -------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| Source guidance becomes stale                | Medium | Link directly to authoritative explanatory pages rather than copying detailed rules or rates. |
| A source link appears promotional            | Low    | Use CFPB and FTC sources for general topics; use Experian only for bureau-specific education. |
| Entry-point additions clutter existing pages | Low    | Use small contextual text links that follow the established visual language.                  |

## Checkpoint: Complete

- [ ] Content structure and sources meet the specification.
- [ ] Automated tests, checks, and build pass.
- [ ] Browser navigation works from both requested starting points.
