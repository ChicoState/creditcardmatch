# Implementation Plan: Card Comparison

The user approved `card-comparison-spec.md`, including four-card selection and
same-tab persistence. Implement that scope on the existing `compare-page` branch.

## Ordered Tasks

1. Add a comparison projection using existing catalog types and active visibility.
   Join rewards to categories and preserve conditions, offers, and benefits.
   Files: projection and unit tests. Verify with targeted Vitest tests.
2. Add shared selection state with defensive session storage, identifier-only
   persistence, uniqueness, selection order, a four-card limit, and reconciliation.
   Files: storage helper, provider, and behavior tests. Verify malformed and
   unavailable storage, add/remove/clear, and stale selections with Vitest.
3. Connect catalog buttons and cart navigation. Mount the provider in the root
   layout, expose count in navigation, and display selected names on catalog and
   comparison pages. Files: results explorer, provider/cart controls, root layout,
   and component tests. Verify filtering retains selection and controls announce
   state and count. Checkpoint: targeted tests, typecheck, and lint pass.
4. Build `/compare` and its responsive table with empty/single/multiple states.
   Files: route, comparison display, comparison CSS module, and component tests.
   Verify fees, reward units and conditions, unknown values, and removal.
5. Add browser coverage and document the flow. Files: comparison Playwright tests,
   README, and these feature documents. Verify the local Supabase flow, refresh,
   filtering, limits, keyboard access, and viewport sizes. Checkpoint: run the
   quality baseline, build, diff hygiene and secret checks; report prerequisites
   or failures accurately and leave the change ready for user review.

## Risks and Boundaries

Session storage is untrusted and may throw. Validate and bound identifiers, catch
storage errors, and retain an in-memory fallback. Resolve names and facts only
from active catalog data; notify users when selections become unavailable.

Do not infer cashback rates from points or miles, omit reward conditions, or
replace unknown fees with zero. Keep comparison scrolling inside its region.

No dependencies, schema, CSV facts, infrastructure, remote writes, deployment, or
authentication changes are needed. Browser MCP tools are unavailable in this
session; use the installed Playwright test runner for real-browser verification.
