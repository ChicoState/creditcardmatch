-- Store the complete validated survey response for the authenticated owner.
-- Recommendations remain derived from this response and the current catalog.

BEGIN;

ALTER TABLE public.user_preferences
    ADD COLUMN survey_answers JSONB,
    ADD COLUMN survey_saved_at TIMESTAMPTZ;

COMMENT ON COLUMN public.user_preferences.survey_answers IS
    'Complete validated SurveySubmission snapshot used to restore the survey; not a recommendation snapshot.';

COMMENT ON COLUMN public.user_preferences.survey_saved_at IS
    'Timestamp of the user''s explicit survey save.';

COMMIT;
