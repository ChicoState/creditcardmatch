# Implementation Plan: Preliminary Database Foundation

## Overview

Deliver the smallest safe, reproducible schema and local starter catalog that
implements the confirmed data-model intent. The work is sequential because the
seed data and test contract depend on the schema.

## Task List

### Task 1: Define the baseline contract

- Acceptance: the specification, ADR, and a failing Vitest migration contract
  describe the approved database boundary.
- Verify: the focused test fails before the schema/seed implementation exists.
- Files: `docs/`, `tests/infrastructure/database-foundation.test.ts`.

### Task 2: Replace the draft baseline migration

- Acceptance: Auth-linked profiles, private user data, catalog tables,
  constraints, indexes, Auth-profile trigger, privileges, and RLS policies are
  represented in one reviewed initial migration.
- Verify: focused migration-contract test passes; `git diff --check` passes.
- Depends on: Task 1.
- Files: `supabase/migrations/20260928120000_initial_schema.sql`.

### Task 3: Add reproducible local starter data

- Acceptance: a local seed file has canonical categories and exactly two active
  cards with official sources and current review dates.
- Verify: focused migration-contract test passes; later, `npx supabase db
reset` validates the SQL when a local Supabase environment is available.
- Depends on: Task 2.
- Files: `supabase/seed.sql`, test contract.

### Task 4: Update the accepted infrastructure plan and project documentation

- Acceptance: the plan records U.S. scope, immediate catalog publishing,
  sources/review dates, canonical categories, fixed caps, owned-card lifecycle,
  and snapshot recommendations; README no longer says data models are absent.
- Verify: documentation review and `git diff --check` pass.
- Depends on: Tasks 2-3.
- Files: `infrastructure_plan.md`, `README.md`, ADR.

## Checkpoint: Complete

- Focused and full automated checks pass where prerequisites are available.
- No migration was run against a remote project.
- A reviewer can identify the source and review date of each starter card.

## Risks and Mitigations

| Risk                                          | Mitigation                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Card terms change                             | Store official source URL and review date; keep data in a seed file that admins can supersede.    |
| RLS accidentally exposes data                 | Revoke defaults, use explicit per-operation policies, and add future local database policy tests. |
| Draft migration was already applied elsewhere | Do not deploy it; reconcile migration history with the owner before any `db push`.                |
