-- Add spending-category focus filters derived from modeled reward categories.

BEGIN;

INSERT INTO public.filters (slug, label, description)
VALUES
    (
        'travel-focus',
        'Travel Focus',
        'Cards with a modeled travel rewards category.'
    ),
    (
        'gas-focus',
        'Gas Focus',
        'Cards with a modeled gas rewards category.'
    ),
    (
        'dining-food-focus',
        'Dining & Food Focus',
        'Cards with a modeled dining or food-delivery rewards category.'
    );

COMMIT;
