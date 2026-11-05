# Implementation Plan: Card Catalog Requests

## Task List

### Phase 1: Data and server boundaries

- [ ] Add request and admin tables, RLS policies, and the `is_admin` helper.
  - Verify with migration tests and type checks.
- [ ] Add validated authenticated request creation and admin review actions.
  - Verify with unit tests for valid, invalid, unauthenticated, and
    unauthorized submissions.

### Phase 2: Catalog interaction

- [ ] Add search, 10-card paging, and empty-state request entry point.
  - Verify with component tests for matching, expansion, reset, and no results.
- [ ] Add the request form and submission feedback.
  - Verify with component tests and a local browser flow.

### Phase 3: Admin review

- [ ] Add the protected admin request page with approve/reject controls.
  - Verify with component tests and an authenticated browser flow.
- [ ] Run formatting, lint, type checking, unit tests, build, and applicable
      browser checks; review the complete diff for security and scope.

## Risks and mitigations

| Risk                                  | Mitigation                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| User input reaches persistent storage | Server-side length, enum, email, and count validation plus RLS                  |
| Signed-in user is not an admin        | Explicit `app_admins` table and server-side `is_admin` check                    |
| Email delivery is unavailable         | Retain the optional address as pending notification data; do not claim delivery |
