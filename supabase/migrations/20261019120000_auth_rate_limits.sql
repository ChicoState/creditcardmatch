-- Server-only atomic rate-limit buckets for application authentication flows.

BEGIN;

CREATE TABLE public.auth_rate_limits (
    purpose TEXT NOT NULL CHECK (purpose IN ('login', 'signup')),
    client_ip INET NOT NULL,
    bucket_start TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL CHECK (attempts > 0),
    PRIMARY KEY (purpose, client_ip, bucket_start)
);

REVOKE ALL ON TABLE public.auth_rate_limits FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.consume_auth_rate_limit(
    p_purpose TEXT,
    p_client_ip INET,
    p_bucket_start TIMESTAMPTZ,
    p_limit INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    accepted BOOLEAN;
BEGIN
    IF p_purpose NOT IN ('login', 'signup')
        OR p_client_ip IS NULL
        OR p_bucket_start IS NULL
        OR p_limit <= 0 THEN
        RETURN FALSE;
    END IF;

    DELETE FROM public.auth_rate_limits
    WHERE bucket_start < p_bucket_start - INTERVAL '15 minutes';

    INSERT INTO public.auth_rate_limits (purpose, client_ip, bucket_start, attempts)
    VALUES (p_purpose, p_client_ip, p_bucket_start, 1)
    ON CONFLICT (purpose, client_ip, bucket_start) DO UPDATE
        SET attempts = public.auth_rate_limits.attempts + 1
        WHERE public.auth_rate_limits.attempts < p_limit
    RETURNING TRUE INTO accepted;

    RETURN COALESCE(accepted, FALSE);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_auth_rate_limit(TEXT, INET, TIMESTAMPTZ, INTEGER)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_auth_rate_limit(TEXT, INET, TIMESTAMPTZ, INTEGER)
    TO service_role;

COMMIT;
