-- Store authenticated user requests for cards that are not in the catalog yet.

BEGIN;

CREATE TABLE public.app_admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.card_requests (
    request_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_name TEXT NOT NULL CHECK (char_length(card_name) BETWEEN 1 AND 160),
    issuer TEXT NOT NULL CHECK (char_length(issuer) BETWEEN 1 AND 120),
    reward_types TEXT[] NOT NULL CHECK (
        cardinality(reward_types) BETWEEN 1 AND 4
    ),
    notification_email TEXT CHECK (
        notification_email IS NULL
        OR notification_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    ),
    comments TEXT CHECK (comments IS NULL OR char_length(comments) <= 2000),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX card_requests_status_created_at_idx
    ON public.card_requests (status, created_at DESC);
CREATE INDEX card_requests_user_id_idx ON public.card_requests (user_id);

ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.app_admins WHERE user_id = (SELECT auth.uid())
    );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE POLICY "Admins can read admin membership"
    ON public.app_admins FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can read their card requests"
    ON public.card_requests FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id OR (SELECT public.is_admin()));
CREATE POLICY "Users can create their card requests"
    ON public.card_requests FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Admins can review card requests"
    ON public.card_requests FOR UPDATE TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

REVOKE ALL ON TABLE public.app_admins, public.card_requests FROM anon;
GRANT SELECT ON TABLE public.app_admins TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.card_requests TO authenticated;

-- Authenticated inserts use the identity sequence for request_id.
REVOKE ALL ON SEQUENCE public.card_requests_request_id_seq FROM anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.card_requests_request_id_seq TO authenticated;

COMMIT;
