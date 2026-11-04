# Implementation Plan: Account Dashboard

## Dependency order

1. Add the owner-scoped roster schema and server data contracts.
2. Add authenticated survey persistence using the existing survey tables.
3. Add the protected account page and roster mutations.
4. Add the searchable roster UI, undo behavior, and navbar entry.
5. Verify unit, component, migration, build, and browser behavior.

## Checkpoints

- After schema/data access: type checks and focused data-contract tests pass.
- After server actions/page: authenticated reads and writes are owner-scoped.
- After UI: component tests and build pass; then run browser coverage if local
  Supabase is available.

## Risks

| Risk                                                | Mitigation                                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Survey data currently lives only in browser storage | Persist signed-in submissions through a server action while retaining local storage. |
| Mutations could bypass page-level auth              | Every Server Action independently calls `auth.getUser()`.                            |
| Inactive cards remain in a saved roster             | Add only active catalog cards and filter roster display through the active catalog.  |
