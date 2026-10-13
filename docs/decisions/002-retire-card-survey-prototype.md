# ADR-002: Replace and retire the card-survey prototype

## Status

Accepted

## Date

2026-10-09

## Context

The approved production survey now includes the useful prototype concepts:
concrete income ranges, score bands, a primary goal, priority categories,
optional category spend, annual-fee acceptance, and optional benefits. Keeping
`app/card_survey` after the production implementation would duplicate question
definitions, interaction logic, and tests without providing another live path.

## Decision

Make `lib/config/survey.ts` and `components/survey/` the only survey source of
truth. Remove the superseded `app/card_survey` prototype and its isolated test.
Keep the selected prototype concepts only where their Phase 2a behavior is
defined in the production configuration and survey specification.

## Consequences

- `/survey` remains the sole survey route and presents seven discrete steps.
- Cash back and building-credit/no-history selections retain the current live
  catalog filtering behavior; all other approved answers remain local only.
- Future survey changes have one implementation, storage contract, and test
  suite to update.
