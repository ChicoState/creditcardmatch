# ADR-003: Refine survey behavior after audit

## Status

Accepted — implementation pending

## Date

2026-11-06

## Context

An audit of the production `/survey` flow found several places where the
intended user experience and the current implementation contract were not
explicitly aligned. The survey collects sensitive financial-preference data,
so the form must be clear about required values, the results page must explain
fallback behavior, and browser-stored data must not be trusted blindly.

The decisions in this ADR refine the survey behavior established by
[ADR-002](./002-retire-card-survey-prototype.md). Account-backed saving remains
future work and is not part of this decision.

## Decision

### Spending amounts

- Selecting a spending category means the visitor is claiming a positive,
  nonzero monthly amount for that category.
- The survey requires a valid positive amount for every selected category before
  advancing.
- The submission retains the amount for every selected category, including
  categories whose values are not yet used by matching or ranking.

### Annual-fee fallback

- A “No” annual-fee answer first attempts to exclude cards with annual fees.
- If that constraint produces no cards, the results flow relaxes only the
  annual-fee constraint while preserving other active filters.
- Relaxed results are labeled as broader alternatives and explain that annual
  fees are the reason the constraint was relaxed.

### Submission normalization and storage

- Derived filter preferences are deduplicated by `filter_slug` before being
  stored or used to build the results URL.
- Local survey data is treated as untrusted input when loaded from
  `localStorage`.
- Malformed, unsupported, or out-of-range stored data is rejected rather than
  partially used.

### Clearing local survey data

- The results page provides a visible action to clear local survey answers.
- Clearing removes the saved survey data and returns the visitor to a blank-slate
  catalog browsing experience rather than continuing to present personalized
  results.

### Results explanation

- The results summary distinguishes answers currently used for matching from
  answers retained for future matching.
- The UI must not imply that income or another retained-but-inactive answer
  influenced the current recommendation.

## Alternatives considered

### Make monthly spending optional

Rejected. Selecting a category is an explicit declaration that the visitor has
a meaningful positive amount for it. Allowing empty values would weaken that
meaning and create an ambiguous result explanation.

### Discard amounts for unsupported categories

Rejected. A visitor who provides an amount should not have that answer silently
discarded. The values can be retained locally even while matching support is
added later.

### Treat annual fees as an absolute filter

Rejected. An empty result is less useful than showing broader cards with a
clear explanation of the tradeoff.

### Automatically save results to an account

Deferred. Future authenticated saving will require an explicit “Save results”
action and a separate server-side design and security review.

## Consequences

- The survey remains strict about the meaning of a selected category while
  retaining a complete local submission.
- Results can remain useful when a strong annual-fee preference has no exact
  catalog match.
- Local-storage parsing requires a real schema-validation boundary rather than
  top-level shape checks.
- The results page owns local-data deletion and the transition back to neutral
  browsing.
- The implementation and tests must distinguish active matching inputs from
  retained future preferences.
