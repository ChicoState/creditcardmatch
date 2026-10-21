-- Add the derived no-annual-fee catalog filter.

BEGIN;

INSERT INTO public.filters (slug, label, description)
VALUES (
    'no-annual-fee',
    'No Annual Fee',
    'Cards with a $0 annual fee.'
);

COMMIT;
