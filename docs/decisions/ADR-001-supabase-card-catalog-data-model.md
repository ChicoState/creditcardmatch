# ADR-001: Use Supabase Auth-linked profiles and a manually curated catalog

## Status

Accepted

## Date

2026-10-05

## Context

Credit-card product feeds are too expensive for the initial application. The
app needs a small U.S. catalog that administrators can edit manually while
users safely store matching preferences and owned-card references. It must not
store financial-account credentials or transaction data.

## Decision

Use Supabase Auth for account identity and a public `profiles` table keyed by
`auth.users(id)`. Model the shared catalog relationally, with separate tables
for categories, reward programs, cards, and reward rates/caps. Use RLS so
standard users access only their data and manually designated administrators
maintain catalog records. Seed two reviewed issuer records locally.

## Alternatives Considered

### Application-managed user table

- Rejected because it duplicates authentication identity and would require
  custom password/session handling.

### Commercial credit-card feed

- Rejected for the initial release because the cost does not fit the project.

### Free-form JSON catalog records

- Rejected because relational categories, reward rates, and caps are central
  to consistent matching and administrator editing.

## Consequences

- Migrations—not direct remote dashboard edits—are the source of truth for
  schema changes.
- Administrators must periodically review card terms and update source dates.
- A future interface/API feature is required before users can edit this data
  through the app; the Supabase Table Editor is the interim administrator tool.
