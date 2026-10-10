# Spec: Production Survey Question Reconciliation

## Objective

Replace the placeholder Phase 2a survey questions with a focused, one-question-
at-a-time wizard that uses the agreed prototype question set where it improves
visitor clarity. Keep anonymous survey completion, local persistence, and the
current catalog-results flow working without a schema migration.

The survey must support visitors who are new to credit, comparing a better card,
or broadly exploring options. New-to-credit is inferred from the selected credit
score band; no separate visitor-journey question is added.

## Current Constraints

- Only `cashback` and `new-to-credit` affect survey-driven results today.
- The catalog has no ranking policy; results are alphabetically ordered after
  active-filter intersection.
- Only `popular-cards`, `cashback`, and `new-to-credit` exist as catalog
  filters.
- The local catalog currently has `Groceries`, `Dining`, and `Travel` reward
  categories. A migration to add more category rows is explicitly out of scope.
- Anonymous survey answers are stored locally. Authenticated server-side saving
  remains Phase 2b work.

## Final Question Flow

| Step | Question and response                                                                                                                                               | Required | Current Phase 2a behavior                                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Annual income: `$40,000 or less`, `$40,001–$60,000`, `$60,001–$80,000`, `$80,001–$100,000`, or `More than $100,000`                                                 | Yes      | Save a stable `income_range` value; do not filter results.                                                                                           |
| 2    | Estimated credit score: `Excellent (740+)`, `Good (670–739)`, `Fair (580–669)`, `Building/no score yet`, or `I'm not sure`                                          | Yes      | Save `credit_score_band`. `Building/no score yet` adds `new-to-credit`; all other answers add no score filter.                                       |
| 3    | Primary goal: cash back, travel rewards, building credit, low/no annual fee, or introductory 0% APR                                                                 | Yes      | Cash back adds `cashback`; building credit adds `new-to-credit`; retain all other selections without changing results.                               |
| 4    | Up to three priority spending categories: groceries, dining/food delivery, gas, travel, shopping, transit/rideshare, streaming/entertainment, or everyday purchases | Yes      | Retain the selected priorities locally. No direct filter or ranking behavior yet.                                                                    |
| 5    | Optional monthly amounts for the selected priority categories                                                                                                       | No       | Retain values locally. Only `groceries`, `dining`, and `travel` enter the compatible `category_monthly_spend` collection without a future migration. |
| 6    | Comfortable paying an annual fee? Yes or no                                                                                                                         | Yes      | Save `accepts_annual_fee`; do not filter results.                                                                                                    |
| 7    | Extra interests: no foreign transaction fee, airport/travel benefits, purchase protection, welcome bonus, balance-transfer offer, or none in particular             | No       | Multi-select with exclusive `None in particular`; retain selections locally without changing results.                                                |

## Submission Contract

`SurveySubmission` remains the local-storage contract for anonymous completion.
It will add explicit, typed fields for:

- `primary_goal`;
- up to three `priority_category_slugs`; and
- `extra_benefit_slugs`.

Existing fields continue to carry the values the Phase 2a data model already
recognizes:

- `income_range` uses a stable range slug;
- `credit_score_band` uses a stable score-band slug, with `no_history` for
  `Building/no score yet` to preserve the current new-to-credit mapping;
- `accepts_annual_fee` is the selected yes/no value; and
- `card_filter_preferences` contains only supported live filters.

The implementation must not add filter rows, card-filter assignments, ranking
logic, migrations, or server-side save handlers. The new locally retained fields
are intentionally not persisted to Supabase until a future Phase 2b schema and
save-flow decision exists.

## User Experience and Accessibility

- Keep the existing wizard pattern: progress text, one question per screen,
  previous/next controls, editable review, and a final results action.
- Explain that income and credit-score answers are estimates used to identify
  suitable cards.
- Disable advancing from required single-choice questions until an answer is
  selected, using native validation as a fallback.
- Enforce a three-category maximum and make the exclusive benefit option clear
  to mouse, keyboard, and assistive-technology users.
- The review screen must show every answer, including answers that do not
  currently change results.

## Testing Strategy

- Unit-test `deriveSurveySubmission` for every live filter mapping and for
  retained-but-non-filtering answers.
- Component-test question order, required validation, the three-category cap,
  exclusive extra-benefit option, review edits, and local result navigation.
- Update the existing Playwright survey paths to complete the seven-step wizard
  and assert the same current catalog-result URLs.

## Boundaries

- Always: preserve Phase 2a local storage and current result URLs; use stable
  machine values rather than display labels; retain selected non-filtering
  answers for review.
- Ask first: schema migrations, catalog filter additions, card assignments,
  ranking-policy changes, or Phase 2b server persistence.
- Never: imply an answer changes results when it does not, write to remote
  Supabase, or commit local environment values or keys.

## Success Criteria

- A visitor can complete all seven steps, revise an answer, and open results.
- Cash back and building-credit paths preserve their current result filtering.
- All other agreed answers are visible in review and survive the local
  submission handoff without changing current filters.
- Existing unit, component, and browser coverage passes after updates.
