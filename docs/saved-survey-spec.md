# Spec: Saved Survey Recommendations

## Objective

Let authenticated users explicitly save their completed survey answers from
the review page. Anonymous users can continue directly to recommendations.
Saved answers can later be selected or replaced, and the account page provides
a dedicated entry point that recomputes recommendations from the saved answers
and the current catalog.

## User flow

- The review page offers `Save answers` and `Continue without saving`.
- Saving requires authentication. A signed-out user is returned to the review
  flow after login or signup with the answers preserved.
- After a successful save, the user is sent to recommendations and sees a
  confirmation that the answers were saved.
- Returning users with saved answers choose between using them and starting a
  new survey; saved answers are never loaded silently.
- The account page contains a dedicated saved-survey section with a
  `View my recommended cards` link, update guidance, and a clear action.

## Persistence boundary

The complete validated `SurveySubmission` is stored as `survey_answers` on the
existing owner-scoped `user_preferences` row. Existing normalized spending and
filter rows continue to support account summaries and future matching. The
saved response is not a recommendation snapshot; recommendations are
recomputed from the saved answer and current catalog.

## Security and boundaries

- Always authenticate and authorize with the current Supabase session.
- Never accept a user ID from the browser.
- Validate every survey field server-side before writing.
- Preserve the existing RLS policies on `user_preferences` and child tables.
- Do not apply migrations to a remote Supabase project as part of this change.
- Do not persist answers when the user chooses to continue without saving.

## Success criteria

- Complete survey answers round-trip through save and load.
- Users can decline saving and still see recommendations.
- Users can choose saved answers or a new survey on return.
- The account shortcut recomputes recommendations without retaking the survey.
- Users can clear saved answers, and another user cannot read them.

## Verification

- Vitest covers validation, save/load/delete boundaries, review controls, and
  account states.
- Migration contract tests cover the new column and existing RLS boundary.
- Playwright covers save, account shortcut, and recommendation notice when the
  local Supabase stack is available.
