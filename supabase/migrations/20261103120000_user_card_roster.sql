-- Store the catalog cards each authenticated user currently owns.

BEGIN;

CREATE TABLE public.user_card_roster (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    card_id BIGINT NOT NULL REFERENCES public.credit_cards(card_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, card_id)
);

CREATE INDEX user_card_roster_card_id_idx
    ON public.user_card_roster (card_id);

ALTER TABLE public.user_card_roster ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read card roster"
    ON public.user_card_roster FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Owners can create card roster entries"
    ON public.user_card_roster FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Owners can update card roster entries"
    ON public.user_card_roster FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Owners can delete card roster entries"
    ON public.user_card_roster FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

REVOKE ALL ON TABLE public.user_card_roster FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_card_roster TO authenticated;

COMMIT;
