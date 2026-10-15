# ADR-001: Use a modular wizard for the production survey

## Status

Superseded by ADR-002

## Date

2026-10-09

## Context

The Phase 2a survey submits the configured survey values to the catalog-results
flow, but presents every question in one long form. `app/card_survey` contains
a separate wizard prototype with different questions and hard-coded results.

## Decision

Keep the Phase 2a `SURVEY_CONFIG`, `SurveySubmission`, local-storage, and
results-query contracts. Present those configured questions one at a time in a
client-side wizard with previous/next controls and an editable review screen.
Extract the shared wizard presentation into `components/survey/`.

## Consequences

- Visitors get the focused, step-by-step flow without changing Phase 2a
  matching behavior.
- The production form has one source of truth for question content and data
  mapping: `lib/config/survey.ts`.
- The original prototype-retention decision was later superseded after the
  approved questions and their Phase 2a matching boundaries were specified.
