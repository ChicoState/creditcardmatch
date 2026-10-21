# Implementation Plan: Credit Card Safety and Disclaimer Page

## Overview

Build a static, source-linked `/disclaimer` page and expose it from the site’s highest-value visitor journeys without changing catalog or matching behavior.

## Task List

- [x] Task 1: Define the confirmed scope and acceptance criteria in `docs/legal-disclaimer-spec.md`.
- [x] Task 2: Add rendering and entry-point tests.
  - Acceptance: the test checks the page heading, legal boundary, risk topics, authoritative source links, and links from home, results, and global navigation.
  - Verify: `npm run test -- tests/app/legal-disclaimer.test.tsx`
- [x] Task 3: Implement the static disclaimer page and responsive styles.
  - Acceptance: all confirmed content is visible in accessible semantic sections and remains readable on mobile.
  - Verify: focused test, `npm run format:check`, and `npm run typecheck`.
- [ ] Task 4: Verify browser navigation and project quality.
  - Acceptance: links work without a blocking acknowledgment and the application builds cleanly.
  - Verify: `npm run test:e2e`, `npm run verify`, and `npm run build` after switching to the required Node 24/npm 11 runtime.

## Risks and Mitigations

| Risk                                       | Impact | Mitigation                                                                                                                      |
| ------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Legal guidance changes or varies by state  | High   | Use current federal sources, avoid state-specific conclusions, and instruct readers to seek qualified help for their situation. |
| Warning overstates collection consequences | High   | Explain that lawsuits and garnishment depend on process and applicable law.                                                     |
| More links clutter existing journeys       | Low    | Use concise contextual links and preserve current primary actions.                                                              |
