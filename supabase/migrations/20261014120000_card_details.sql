-- Add verified catalog details, reward caps, final enum constraints, and
-- automatic credit-card update timestamps.

BEGIN;

ALTER TABLE public.credit_cards
    ADD COLUMN slug TEXT NOT NULL UNIQUE,
    ADD COLUMN network TEXT
        CHECK (network IN ('visa', 'mastercard', 'amex', 'discover')),
    ADD COLUMN point_value_cents DECIMAL(6,3)
        CHECK (point_value_cents > 0),
    ADD COLUMN annual_fee_waived_first_year BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN one_time_fee DECIMAL(10,2)
        CHECK (one_time_fee >= 0),
    ADD COLUMN monthly_fee DECIMAL(10,2)
        CHECK (monthly_fee >= 0),
    ADD COLUMN foreign_transaction_fee_percent DECIMAL(5,2)
        CHECK (foreign_transaction_fee_percent >= 0),
    ADD COLUMN is_secured BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN security_deposit_min DECIMAL(10,2)
        CHECK (security_deposit_min >= 0),
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD CONSTRAINT credit_cards_annual_fee_check CHECK (annual_fee >= 0),
    ADD CONSTRAINT credit_cards_reward_type_check
        CHECK (reward_type IN ('cashback', 'points', 'miles', 'none')),
    ADD CONSTRAINT credit_cards_credit_level_required_check
        CHECK (credit_level_required IN ('none', 'fair', 'good', 'excellent'));

COMMENT ON COLUMN public.credit_cards.point_value_cents IS
    'Value of one point or mile in cents. NULL means unknown; future reward-based ranking must exclude the card from reward calculations.';

CREATE FUNCTION public.set_credit_cards_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_credit_cards_updated_at
    BEFORE UPDATE ON public.credit_cards
    FOR EACH ROW
    EXECUTE FUNCTION public.set_credit_cards_updated_at();

ALTER TABLE public.card_rewards
    ADD COLUMN spend_cap DECIMAL(10,2)
        CHECK (spend_cap > 0),
    ADD COLUMN cap_period TEXT
        CHECK (cap_period IN ('month', 'quarter', 'year')),
    ADD COLUMN rate_after_cap DECIMAL(4,2)
        CHECK (rate_after_cap >= 0),
    ADD COLUMN notes TEXT,
    ADD CONSTRAINT card_rewards_reward_rate_check CHECK (reward_rate >= 0),
    ADD CONSTRAINT card_rewards_spend_cap_period_check
        CHECK ((spend_cap IS NULL) = (cap_period IS NULL));

COMMENT ON COLUMN public.card_rewards.reward_rate IS
    'Percent for cashback (3 = 3%), or units per $1 for points/miles (3 = 3x). Value per $1 in cents = reward_rate * credit_cards.point_value_cents.';

ALTER TABLE public.reward_categories
    ADD COLUMN slug TEXT NOT NULL UNIQUE,
    ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;

INSERT INTO public.reward_categories (category_name, slug, display_order)
VALUES
    ('Groceries', 'groceries', 1),
    ('Dining', 'dining', 2),
    ('Gas', 'gas', 3),
    ('Travel', 'travel', 4),
    ('Streaming', 'streaming', 5),
    ('Online Shopping', 'online_shopping', 6),
    ('Other', 'other', 7);

ALTER TABLE public.user_preferences
    ADD COLUMN carries_balance BOOLEAN,
    ADD CONSTRAINT user_preferences_credit_score_range_check
        CHECK (credit_score_range IN ('none', 'fair', 'good', 'excellent'));

-- Catalog grants remain SELECT-only for browser roles. RLS remains enabled,
-- and the existing migrations define SELECT policies without write policies.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON TABLE public.credit_cards,
       public.reward_categories,
       public.card_rewards,
       public.card_benefits,
       public.filters,
       public.card_filters
    FROM anon, authenticated;

COMMIT;
