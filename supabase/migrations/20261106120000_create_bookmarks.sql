-- Store the cards each authenticated user chose to keep for later.
BEGIN;

CREATE TABLE public.bookmarks (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    card_id BIGINT NOT NULL REFERENCES public.credit_cards(card_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, card_id)
);

CREATE INDEX bookmarks_card_id_idx ON public.bookmarks (card_id);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read bookmarks"
    ON public.bookmarks FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Owners can create bookmarks"
    ON public.bookmarks FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Owners can delete bookmarks"
    ON public.bookmarks FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

REVOKE ALL ON TABLE public.bookmarks FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.bookmarks TO authenticated;

COMMIT;
