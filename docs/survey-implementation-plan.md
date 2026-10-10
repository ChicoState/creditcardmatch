# Implementation Plan: Production Survey Question Reconciliation

## Overview

Implement the agreed seven-step survey without changing the Phase 2a Supabase
schema or live catalog vocabulary. Work proceeds from typed configuration to
submission mapping, then wizard UI and regression coverage.

## Architecture Decisions

- `lib/config/survey.ts` remains the single source of truth for production
  question content, machine values, and current filter mappings.
- `components/survey-form.tsx` continues to orchestrate local wizard state;
  question-specific rendering remains under `components/survey/`.
- Only current filter slugs are emitted in `card_filter_preferences`; locally
  retained future preferences are separate typed fields.
- The superseded `app/card_survey` prototype is removed once this production
  implementation and its replacement coverage are verified.

## Task List

### Task 1: Define the survey vocabulary and submission types

- Acceptance:
  - Replace placeholder income and credit options with the approved labels and
    stable values.
  - Define primary-goal, priority-category, annual-fee, and extra-benefit
    option types in the production configuration.
  - Extend the anonymous `SurveySubmission` shape only for locally retained
    answers; do not alter the database schema.
- Verify: focused configuration and submission-mapping unit tests.
- Files: `lib/config/enumerated-values.ts`, `lib/config/survey.ts`,
  `tests/unit/survey-config.test.ts`.

### Task 2: Map supported answers to current results behavior

- Acceptance:
  - Map `Building/no score yet` and primary goal `Building credit` to
    `new-to-credit`.
  - Map primary goal `Cash back` to `cashback`.
  - Do not emit filters for income, annual-fee preference, travel, 0% APR,
    category priorities, monthly amounts, or extra benefits.
- Verify: unit tests assert exact result-filter slugs and retained values.
- Dependencies: Task 1.
- Files: `lib/config/survey.ts`, `tests/unit/survey-config.test.ts`.

### Task 3: Render the seven-step question flow

- Acceptance:
  - Replace the current five steps with the approved order and controls.
  - Add priority-category selection with a maximum of three selections.
  - Reveal amount inputs only for selected categories.
  - Add yes/no annual-fee selection and exclusive `None in particular` extra
    benefits behavior.
- Verify: component tests cover validation, caps, exclusive selection, back
  navigation, and review edits.
- Dependencies: Tasks 1–2.
- Files: `components/survey-form.tsx`, `components/survey/`,
  `app/globals.css`, `tests/app/survey-form.test.tsx`.

### Task 4: Preserve review, storage, and result navigation

- Acceptance:
  - Review displays all seven answers, including non-filtering preferences.
  - Local storage round-trips the extended submission shape safely.
  - Final navigation continues to use only supported derived filters.
- Verify: component/storage tests and current filtered-result unit coverage.
- Dependencies: Tasks 1–3.
- Files: `components/survey-form.tsx`, `lib/storage/survey-storage.ts`,
  `tests/app/survey-form.test.tsx`, `tests/unit/survey-storage.test.ts`.

### Task 5: Retire the superseded prototype, update coverage, and document the decision

- Acceptance:
  - Playwright paths complete the seven-step survey and retain their existing
    result expectations.
  - Documentation accurately states the answers that do and do not affect
    current results.
  - Remove `app/card_survey` and its isolated test only after the production
    configuration, wizard, and replacement coverage are in place.
- Verify: `npm run test:e2e`, formatting, linting, type checking, and build.
- Dependencies: Tasks 1–4.
- Files: `app/card_survey/`, `tests/app/card-survey.test.tsx`,
  `tests/e2e/catalog.spec.ts`, `README.md`,
  `docs/survey-implementation-spec.md`.

## Checkpoints

### After Tasks 1–2

- Submission type is explicit and all live mappings are unit-tested.
- No unsupported filter slug can enter a results URL.

### After Tasks 3–4

- The local wizard works end-to-end with all new answers visible in review.
- Existing storage behavior still handles unavailable browser storage safely.

### Completion

- `npm test`, `npm run lint`, `npm run typecheck`, and applicable browser tests
  pass.
- `git diff --check` passes and no environment values or generated artifacts
  are included.

## Risks and Mitigations

| Risk                                                             | Impact                        | Mitigation                                                                                |
| ---------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------- |
| Users infer unsupported answers affect results                   | Misleading recommendations    | Use clear explanatory copy and retain only current supported filter mappings.             |
| Extra category choices cannot be saved to existing database rows | Future Phase 2b save mismatch | Retain answers locally; require migration review before authenticated persistence.        |
| A primary goal and extra benefits become contradictory           | Confusing data                | Treat primary goal as one required priority and benefits as optional secondary interests. |
| New wizard controls regress keyboard use                         | Accessibility regression      | Test native controls, selection limits, review edits, and focus movement.                 |

## Out of Scope

- New Supabase migrations, filters, card assignments, or ranking rules.
- Remote Supabase changes.
- Authentication and server-side survey saving.
