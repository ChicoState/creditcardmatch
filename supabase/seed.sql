BEGIN;

UPDATE public.filters
SET description = CASE slug
    WHEN 'popular-cards' THEN 'Frequently explored fictional cards.'
    WHEN 'cashback' THEN 'Fictional cards with cashback-style rewards.'
    WHEN 'new-to-credit' THEN 'Fictional cards intended for a newer credit profile.'
END
WHERE slug IN ('popular-cards', 'cashback', 'new-to-credit');

INSERT INTO public.credit_cards (
    issuer,
    card_name,
    annual_fee,
    intro_offer,
    apply_url,
    is_active,
    image_url,
    description,
    reward_type,
    credit_level_required,
    source_url,
    last_verified_at,
    is_verified
)
VALUES
    (
        'Fictional Aurora Community Bank',
        'Aurora Cash Card',
        0,
        NULL,
        NULL,
        TRUE,
        NULL,
        'A fictional everyday card designed to make a simple catalog easy to compare.',
        'cashback',
        'good',
        NULL,
        '2026-09-15T00:00:00Z',
        TRUE
    ),
    (
        'Fictional Harborline Financial',
        'Harbor Starter Card',
        0,
        NULL,
        NULL,
        TRUE,
        NULL,
        'A fictional starter option included to exercise new-to-credit matching.',
        'points',
        'no_history',
        NULL,
        NULL,
        FALSE
    ),
    (
        'Fictional Meadow Mutual',
        'Meadow Cash Starter',
        0,
        NULL,
        NULL,
        TRUE,
        NULL,
        'A fictional card that demonstrates combined cashback and new-to-credit filters.',
        'cashback',
        'no_history',
        NULL,
        '2026-09-18T00:00:00Z',
        TRUE
    ),
    (
        'Fictional Summit Grove Credit Union',
        'Summit Flex Card',
        0,
        NULL,
        NULL,
        TRUE,
        NULL,
        'A fictional popular card with a short, neutral catalog description.',
        'points',
        'good',
        NULL,
        '2026-09-20T00:00:00Z',
        TRUE
    ),
    (
        'Fictional Old Pine Bank',
        'Archived Sample Card',
        0,
        NULL,
        NULL,
        FALSE,
        NULL,
        'An inactive fictional card that must stay out of results.',
        'cashback',
        'good',
        NULL,
        NULL,
        FALSE
    );

INSERT INTO public.reward_categories (category_name)
VALUES ('Groceries'), ('Dining'), ('Travel');

INSERT INTO public.card_rewards (card_id, category_id, reward_rate)
SELECT card.card_id, category.category_id, reward.reward_rate
FROM (
    VALUES
        ('Aurora Cash Card', 'Groceries', 3.00),
        ('Aurora Cash Card', 'Dining', 2.00),
        ('Harbor Starter Card', 'Groceries', 1.00),
        ('Meadow Cash Starter', 'Groceries', 2.50),
        ('Meadow Cash Starter', 'Dining', 2.50),
        ('Summit Flex Card', 'Travel', 3.00),
        ('Archived Sample Card', 'Travel', 5.00)
) AS reward(card_name, category_name, reward_rate)
JOIN public.credit_cards AS card USING (card_name)
JOIN public.reward_categories AS category USING (category_name);

INSERT INTO public.card_filters (card_id, filter_id)
SELECT card.card_id, filter.filter_id
FROM (
    VALUES
        ('Aurora Cash Card', 'popular-cards'),
        ('Aurora Cash Card', 'cashback'),
        ('Harbor Starter Card', 'popular-cards'),
        ('Harbor Starter Card', 'new-to-credit'),
        ('Meadow Cash Starter', 'cashback'),
        ('Meadow Cash Starter', 'new-to-credit'),
        ('Summit Flex Card', 'popular-cards'),
        ('Archived Sample Card', 'popular-cards'),
        ('Archived Sample Card', 'cashback'),
        ('Archived Sample Card', 'new-to-credit')
) AS assignment(card_name, filter_slug)
JOIN public.credit_cards AS card USING (card_name)
JOIN public.filters AS filter ON filter.slug = assignment.filter_slug;

INSERT INTO public.card_benefits (card_id, description, sort_order)
SELECT card.card_id, benefit.description, benefit.sort_order
FROM (
    VALUES
        ('Aurora Cash Card', 'No fictional annual fee', 1),
        ('Aurora Cash Card', 'Simple fictional cashback structure', 2),
        ('Harbor Starter Card', 'Designed for the no-history test scenario', 1),
        ('Harbor Starter Card', 'No fictional annual fee', 2),
        ('Meadow Cash Starter', 'Combines two seeded filter examples', 1),
        ('Meadow Cash Starter', 'Straightforward fictional cash rewards', 2),
        ('Summit Flex Card', 'Flexible fictional points', 1),
        ('Summit Flex Card', 'No fictional annual fee', 2),
        ('Archived Sample Card', 'Inactive catalog visibility example', 1)
) AS benefit(card_name, description, sort_order)
JOIN public.credit_cards AS card USING (card_name);

COMMIT;
