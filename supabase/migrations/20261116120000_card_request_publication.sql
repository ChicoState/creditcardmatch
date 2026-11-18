-- Review before application. Does not publish or reinterpret legacy requests.
BEGIN;
ALTER TABLE public.card_requests
  DROP CONSTRAINT card_requests_reward_types_check,
  ALTER COLUMN reward_types SET DEFAULT '{}',
  ADD COLUMN submission_details JSONB CHECK (submission_details IS NULL OR jsonb_typeof(submission_details) = 'object'),
  ADD COLUMN decision_note TEXT CHECK (char_length(decision_note) <= 2000),
  ADD COLUMN catalog_card_id BIGINT REFERENCES public.credit_cards(card_id),
  ADD COLUMN revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0);

CREATE TABLE public.card_request_drafts (
  request_id BIGINT PRIMARY KEY REFERENCES public.card_requests(request_id) ON DELETE CASCADE,
  details JSONB NOT NULL CHECK (jsonb_typeof(details) = 'object'),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.card_request_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins read review drafts" ON public.card_request_drafts
  FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
GRANT SELECT ON public.card_request_drafts TO authenticated;
REVOKE ALL ON public.card_request_drafts FROM anon;
-- All mutations go through authenticated, validated server operations.
REVOKE INSERT, UPDATE, DELETE ON public.card_requests FROM authenticated;
DROP POLICY "Users can create their card requests" ON public.card_requests;
DROP POLICY "Admins can review card requests" ON public.card_requests;
REVOKE ALL ON SEQUENCE public.card_requests_request_id_seq FROM authenticated;

CREATE FUNCTION public.review_card_request(
  p_actor UUID, p_request BIGINT, p_revision INTEGER, p_action TEXT,
  p_details JSONB DEFAULT NULL, p_note TEXT DEFAULT NULL, p_card BIGINT DEFAULT NULL,
  p_verified BOOLEAN DEFAULT FALSE
) RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  req public.card_requests%ROWTYPE;
  card public.credit_cards%ROWTYPE;
  item JSONB;
  new_card BIGINT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = p_actor) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO req FROM public.card_requests WHERE request_id = p_request FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found' USING ERRCODE = 'P0002'; END IF;
  IF req.status <> 'pending' OR req.revision <> p_revision THEN
    RAISE EXCEPTION 'Request changed; reload before reviewing' USING ERRCODE = '40001';
  END IF;
  IF p_action = 'save' THEN
    INSERT INTO public.card_request_drafts(request_id, details, updated_by)
      VALUES(p_request, p_details, p_actor)
      ON CONFLICT(request_id) DO UPDATE SET details = EXCLUDED.details, updated_by = p_actor, updated_at = now();
    UPDATE public.card_requests SET revision = revision + 1 WHERE request_id = p_request;
    RETURN NULL;
  ELSIF p_action = 'deny' THEN
    IF p_note IS NULL OR char_length(trim(p_note)) = 0 THEN RAISE EXCEPTION 'Decision note required'; END IF;
  ELSIF p_action = 'link' THEN
    SELECT card_id INTO new_card FROM public.credit_cards WHERE card_id = p_card AND is_active AND is_verified;
    IF new_card IS NULL THEN RAISE EXCEPTION 'Choose an active verified card'; END IF;
  ELSIF p_action = 'publish' THEN
    IF p_verified IS DISTINCT FROM TRUE OR p_details IS NULL THEN RAISE EXCEPTION 'Verification required'; END IF;
    SELECT * INTO card FROM jsonb_populate_record(NULL::public.credit_cards, p_details);
    IF card.annual_fee IS NULL OR card.reward_type IS NULL OR card.is_secured IS NULL
      OR card.annual_fee_waived_first_year IS NULL OR coalesce(card.source_url, '') !~ '^https://'
      OR coalesce(trim(card.card_name), '') = '' OR coalesce(trim(card.issuer), '') = ''
      OR jsonb_array_length(p_details->'filter_ids') < 1
      OR (card.reward_type IN ('points','miles') AND card.point_value_cents IS NULL)
      OR (card.reward_type <> 'none' AND jsonb_array_length(p_details->'rewards') < 1)
      THEN RAISE EXCEPTION 'Required catalog facts missing'; END IF;
    -- Serialize equal issuer/name publications while retaining existing catalog naming.
    PERFORM pg_advisory_xact_lock(hashtextextended(lower(trim(card.issuer)) || ':' || lower(trim(card.card_name)), 0));
    IF EXISTS (SELECT 1 FROM public.credit_cards c WHERE lower(trim(c.issuer)) = lower(trim(card.issuer)) AND lower(trim(c.card_name)) = lower(trim(card.card_name))) THEN
      RAISE EXCEPTION 'Card already exists; link the existing card' USING ERRCODE = '23505';
    END IF;
    INSERT INTO public.credit_cards(
      slug, card_name, issuer, source_url, apply_url, annual_fee, monthly_fee, one_time_fee,
      foreign_transaction_fee_percent, annual_fee_waived_first_year, is_secured, security_deposit_min,
      network, credit_level_required, description, intro_offer, reward_type, point_value_cents,
      is_active, is_verified, last_verified_at
    ) VALUES (
      'requested-card-' || p_request, card.card_name, card.issuer, card.source_url, card.source_url,
      card.annual_fee, card.monthly_fee, card.one_time_fee, card.foreign_transaction_fee_percent,
      card.annual_fee_waived_first_year, card.is_secured, card.security_deposit_min,
      card.network, card.credit_level_required, card.description, card.intro_offer, card.reward_type,
      card.point_value_cents, TRUE, TRUE, now()
    ) RETURNING card_id INTO new_card;
    INSERT INTO public.card_filters(card_id, filter_id)
      SELECT new_card, value::BIGINT FROM jsonb_array_elements_text(p_details->'filter_ids');
    FOR item IN SELECT value FROM jsonb_array_elements(p_details->'rewards') LOOP
      INSERT INTO public.card_rewards(card_id, category_id, reward_rate, spend_cap, cap_period, rate_after_cap, notes)
        VALUES(new_card, (item->>'category_id')::BIGINT, (item->>'reward_rate')::NUMERIC,
          (item->>'spend_cap')::NUMERIC, item->>'cap_period', (item->>'rate_after_cap')::NUMERIC, item->>'notes');
    END LOOP;
    INSERT INTO public.card_benefits(card_id, description, sort_order)
      SELECT new_card, value, (ordinality - 1)::INTEGER FROM jsonb_array_elements_text(p_details->'benefits') WITH ORDINALITY;
  ELSE RAISE EXCEPTION 'Unknown review action';
  END IF;
  UPDATE public.card_requests SET status = CASE WHEN p_action = 'deny' THEN 'rejected' ELSE 'approved' END,
    decision_note = nullif(trim(p_note), ''), catalog_card_id = new_card,
    reviewed_by = p_actor, reviewed_at = now(), revision = revision + 1 WHERE request_id = p_request;
  DELETE FROM public.card_request_drafts WHERE request_id = p_request;
  RETURN new_card;
END;
$$;
REVOKE ALL ON FUNCTION public.review_card_request(UUID,BIGINT,INTEGER,TEXT,JSONB,TEXT,BIGINT,BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_card_request(UUID,BIGINT,INTEGER,TEXT,JSONB,TEXT,BIGINT,BOOLEAN) TO service_role;
COMMIT;
