-- Keep saved-survey snapshots and relational answers in one transaction.
-- Assumes one survey save/clear at a time per account; no explicit concurrency control.
BEGIN;

CREATE FUNCTION public.save_survey_answers(p_submission JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    owner_id UUID := auth.uid();
BEGIN
    IF owner_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;
    IF jsonb_typeof(p_submission) IS DISTINCT FROM 'object'
        OR jsonb_typeof(p_submission -> 'category_monthly_spend') IS DISTINCT FROM 'array'
        OR jsonb_typeof(p_submission -> 'user_filter_preferences') IS DISTINCT FROM 'array'
        OR jsonb_typeof(p_submission -> 'user_preferences') IS DISTINCT FROM 'object'
    THEN
        RAISE EXCEPTION 'Invalid survey submission' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.profiles (id) VALUES (owner_id)
        ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_preferences (
        user_id, credit_score_range, income_range, accepts_annual_fee,
        wants_travel_rewards, survey_answers, survey_saved_at
    ) VALUES (
        owner_id,
        p_submission ->> 'credit_score_band',
        p_submission ->> 'income_range',
        (p_submission ->> 'accepts_annual_fee')::BOOLEAN,
        (p_submission -> 'user_preferences' ->> 'wants_travel_rewards')::BOOLEAN,
        p_submission,
        clock_timestamp()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        credit_score_range = EXCLUDED.credit_score_range,
        income_range = EXCLUDED.income_range,
        accepts_annual_fee = EXCLUDED.accepts_annual_fee,
        wants_travel_rewards = EXCLUDED.wants_travel_rewards,
        survey_answers = EXCLUDED.survey_answers,
        survey_saved_at = EXCLUDED.survey_saved_at;

    DELETE FROM public.user_category_spend WHERE user_id = owner_id;
    INSERT INTO public.user_category_spend (user_id, category_id, monthly_amount)
    SELECT owner_id, category.category_id, spend.monthly_amount
    FROM jsonb_to_recordset(p_submission -> 'category_monthly_spend')
        AS spend(category_slug TEXT, monthly_amount NUMERIC)
    JOIN public.reward_categories AS category ON category.slug = spend.category_slug;

    DELETE FROM public.user_filter_preferences WHERE user_id = owner_id;
    INSERT INTO public.user_filter_preferences (user_id, filter_id, preference)
    SELECT owner_id, catalog_filter.filter_id, answer.preference
    FROM jsonb_to_recordset(p_submission -> 'user_filter_preferences')
        AS answer(filter_slug TEXT, preference TEXT)
    JOIN public.filters AS catalog_filter ON catalog_filter.slug = answer.filter_slug;
END;
$$;

CREATE FUNCTION public.clear_survey_answers()
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    owner_id UUID := auth.uid();
BEGIN
    IF owner_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;


    UPDATE public.user_preferences SET
        survey_answers = NULL,
        survey_saved_at = NULL,
        credit_score_range = NULL,
        income_range = NULL,
        accepts_annual_fee = NULL,
        wants_travel_rewards = NULL
    WHERE user_id = owner_id;
    DELETE FROM public.user_category_spend WHERE user_id = owner_id;
    DELETE FROM public.user_filter_preferences WHERE user_id = owner_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_survey_answers(JSONB) FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.clear_survey_answers() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.save_survey_answers(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_survey_answers() TO authenticated;

COMMIT;
