-- generated — do not edit
-- Source: data/card-catalog/{cards,rewards,benefits}.csv
-- Imported: 20 cards, 45 reward rows, 60 benefits

BEGIN;

INSERT INTO public.credit_cards (
    slug, issuer, card_name, network, reward_type, credit_level_required,
    point_value_cents, annual_fee, annual_fee_waived_first_year, one_time_fee,
    monthly_fee, foreign_transaction_fee_percent, is_secured, security_deposit_min,
    intro_offer, apply_url, is_active, image_url, description, source_url,
    last_verified_at, is_verified
)
VALUES
    ('citi-double-cash', 'Citi', 'Citi Double Cash Card', 'mastercard', 'cashback', NULL, 1, 0, FALSE, NULL, NULL, NULL, FALSE, NULL, NULL, 'https://www.citi.com/credit-cards/citi-double-cash-credit-card', TRUE, NULL, 'Flat 2% on everything (1% when you buy, 1% when you pay); no categories to track.', 'https://www.citi.com/credit-cards/citi-double-cash-credit-card', '2026-10-11', TRUE),
    ('chase-freedom-unlimited', 'Chase', 'Chase Freedom Unlimited', NULL, 'cashback', NULL, 1, 0, FALSE, NULL, NULL, NULL, FALSE, NULL, '$200 (20,000 points) after $500 in purchases in the first 3 months; 0% intro APR for 15 months.', 'https://creditcards.chase.com/cash-back-credit-cards/freedom/unlimited', TRUE, NULL, 'No-fee card with 1.5% on everything plus higher rates on dining and drugstores.', 'https://creditcards.chase.com/cash-back-credit-cards/freedom/unlimited', '2026-10-11', TRUE),
    ('wells-fargo-active-cash', 'Wells Fargo', 'Wells Fargo Active Cash Card', 'visa', 'cashback', NULL, 1, 0, FALSE, NULL, NULL, 3, FALSE, NULL, '0% intro APR for 12 months on purchases and qualifying balance transfers (cash bonus not shown).', 'https://creditcards.wellsfargo.com/active-cash-credit-card/', TRUE, NULL, 'Flat 2% cash rewards on every purchase with built-in cell phone protection.', 'https://creditcards.wellsfargo.com/active-cash-credit-card/', '2026-10-11', TRUE),
    ('amex-blue-cash-everyday', 'American Express', 'Blue Cash Everyday Card', 'amex', 'cashback', NULL, 1, 0, FALSE, NULL, NULL, 2.7, FALSE, NULL, NULL, 'https://www.americanexpress.com/us/credit-cards/card/blue-cash-everyday/', TRUE, NULL, 'No-fee card that pays extra at U.S. supermarkets, U.S. online retail and U.S. gas stations.', 'https://www.americanexpress.com/us/credit-cards/card/blue-cash-everyday/', '2026-10-11', TRUE),
    ('amex-blue-cash-preferred', 'American Express', 'Blue Cash Preferred Card', 'amex', 'cashback', NULL, 1, 95, TRUE, NULL, NULL, 2.7, FALSE, NULL, NULL, 'https://www.americanexpress.com/us/credit-cards/card/blue-cash-preferred/', TRUE, NULL, 'Higher-earning grocery and streaming card with an annual fee after the first year.', 'https://www.americanexpress.com/us/credit-cards/card/blue-cash-preferred/', '2026-10-11', TRUE),
    ('capital-one-savor', 'Capital One', 'Savor Rewards', NULL, 'cashback', 'excellent', 1, 0, FALSE, NULL, NULL, 0, FALSE, NULL, '$200 after $500 in purchases in the first 3 months; 0% intro APR for 12 months.', 'https://www.capitalone.com/credit-cards/savor/', TRUE, NULL, 'No-fee card with 3% on groceries, dining, entertainment and popular streaming.', 'https://www.capitalone.com/credit-cards/savor/', '2026-10-11', TRUE),
    ('discover-it-cash-back', 'Discover', 'Discover it Cash Back', NULL, 'cashback', NULL, 1, 0, FALSE, NULL, NULL, NULL, FALSE, NULL, 'Cashback Match: all cash back earned in the first year is matched, no cap; 0% intro APR for 15 months.', 'https://www.discover.com/credit-cards/cash-back/it-card.html', TRUE, NULL, 'No-fee card with 5% in quarterly rotating categories (activation required) and 1% elsewhere.', 'https://www.discover.com/credit-cards/cash-back/it-card.html', '2026-10-11', TRUE),
    ('chase-freedom-flex', 'Chase', 'Chase Freedom Flex', NULL, 'cashback', NULL, 1, 0, FALSE, NULL, NULL, 0, FALSE, NULL, '$250 after $500 in purchases in the first 3 months; 0% intro APR for 15 months.', 'https://creditcards.chase.com/cash-back-credit-cards/freedom/flex', TRUE, NULL, 'No-fee card with 5% rotating quarterly categories, 3% dining and drugstores, 1% elsewhere.', 'https://creditcards.chase.com/cash-back-credit-cards/freedom/flex', '2026-10-11', TRUE),
    ('bofa-customized-cash-rewards', 'Bank of America', 'Bank of America Customized Cash Rewards', NULL, 'cashback', NULL, 1, 0, FALSE, NULL, NULL, NULL, FALSE, NULL, '$200 after $1,000 in purchases in the first 90 days; choice category 6% in year one; 0% intro APR for 15 billing cycles.', 'https://www.bankofamerica.com/credit-cards/products/cash-back-credit-card/', TRUE, NULL, 'No-fee card where you pick one 3% category (gas, online shopping, dining, travel, drugstores or home improvement).', 'https://www.bankofamerica.com/credit-cards/products/cash-back-credit-card/', '2026-10-11', TRUE),
    ('chase-sapphire-preferred', 'Chase', 'Chase Sapphire Preferred', NULL, 'points', NULL, NULL, 95, FALSE, NULL, NULL, 0, FALSE, NULL, '75,000 bonus points after $5,000 in purchases in the first 3 months.', 'https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred', TRUE, NULL, 'Travel rewards card with transferable points and travel protections.', 'https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred', '2026-10-11', TRUE),
    ('capital-one-venture', 'Capital One', 'Venture Rewards', NULL, 'miles', 'excellent', 1, 95, FALSE, NULL, NULL, 0, FALSE, NULL, '75,000 bonus miles after $4,000 in purchases in the first 3 months, plus a one-time $300 Capital One Travel credit.', 'https://www.capitalone.com/credit-cards/venture/', TRUE, NULL, 'Simple travel card that earns 2 miles per dollar on everything.', 'https://www.capitalone.com/credit-cards/venture/', '2026-10-11', TRUE),
    ('capital-one-ventureone', 'Capital One', 'VentureOne Rewards', NULL, 'miles', 'excellent', NULL, 0, FALSE, NULL, NULL, 0, FALSE, NULL, '20,000 bonus miles after $500 in purchases in the first 3 months; 0% intro APR for 15 months.', 'https://www.capitalone.com/credit-cards/ventureone/', TRUE, NULL, 'No-fee version of Venture earning 1.25 miles per dollar on everything.', 'https://www.capitalone.com/credit-cards/ventureone/', '2026-10-11', TRUE),
    ('amex-gold', 'American Express', 'American Express Gold Card', 'amex', 'points', NULL, NULL, 325, FALSE, NULL, NULL, 0, FALSE, NULL, NULL, 'https://www.americanexpress.com/us/credit-cards/card/gold-card/', TRUE, NULL, 'Premium dining and grocery card with monthly dining and Uber credits.', 'https://www.americanexpress.com/us/credit-cards/card/gold-card/', '2026-10-11', TRUE),
    ('citi-strata-premier', 'Citi', 'Citi Strata Premier Card', 'mastercard', 'points', NULL, NULL, 95, FALSE, NULL, NULL, 0, FALSE, NULL, NULL, 'https://www.citi.com/credit-cards/citi-strata-premier-credit-card', TRUE, NULL, 'Points card with 3x on travel, dining, supermarkets and gas.', 'https://www.citi.com/credit-cards/citi-strata-premier-credit-card', '2026-10-11', TRUE),
    ('capital-one-platinum-secured', 'Capital One', 'Platinum Secured', NULL, 'none', 'none', NULL, 0, FALSE, NULL, NULL, 0, TRUE, 49, NULL, 'https://www.capitalone.com/credit-cards/platinum-secured/', TRUE, NULL, 'Secured card to build credit with a refundable deposit; no rewards.', 'https://www.capitalone.com/credit-cards/platinum-secured/', '2026-10-11', TRUE),
    ('discover-it-secured', 'Discover', 'Discover it Secured Credit Card', NULL, 'cashback', 'none', 1, 0, FALSE, NULL, NULL, NULL, TRUE, 49, 'Cashback Match: first-year cash back matched, no cap.', 'https://www.discover.com/credit-cards/secured/', TRUE, NULL, 'Secured card that also earns cash back, with a path to an unsecured card.', 'https://www.discover.com/credit-cards/secured/', '2026-10-11', TRUE),
    ('capital-one-quicksilver-secured', 'Capital One', 'Quicksilver Secured', NULL, 'cashback', 'fair', 1, 0, FALSE, NULL, NULL, 0, TRUE, 200, NULL, 'https://www.capitalone.com/credit-cards/quicksilver-secured/', TRUE, NULL, 'Secured card that earns a flat 1.5% cash back.', 'https://www.capitalone.com/credit-cards/quicksilver-secured/', '2026-10-11', TRUE),
    ('chase-freedom-rise', 'Chase', 'Chase Freedom Rise', NULL, 'cashback', 'none', 1, 0, FALSE, NULL, NULL, NULL, FALSE, NULL, '$25 statement credit for enrolling in autopay within 3 months (stay enrolled 90 days).', 'https://creditcards.chase.com/cash-back-credit-cards/freedom/rise', TRUE, NULL, 'Starter card for people new to credit that earns 1.5% on everything.', 'https://creditcards.chase.com/cash-back-credit-cards/freedom/rise', '2026-10-11', TRUE),
    ('discover-it-student-cash-back', 'Discover', 'Discover it Student Cash Back', NULL, 'cashback', 'none', 1, 0, FALSE, NULL, NULL, NULL, FALSE, NULL, 'Cashback Match: first-year cash back matched, no cap; 0% intro APR on purchases for 6 months.', 'https://www.discover.com/credit-cards/student/it-card.html', TRUE, NULL, 'Student card with 5% rotating categories and 1% elsewhere.', 'https://www.discover.com/credit-cards/student/it-card.html', '2026-10-11', TRUE),
    ('capital-one-savor-student', 'Capital One', 'Savor Rewards for Students', NULL, 'cashback', NULL, 1, 0, FALSE, NULL, NULL, 0, FALSE, NULL, '$50 after $100 in purchases in the first 3 months.', 'https://www.capitalone.com/credit-cards/savor-student/', TRUE, NULL, 'Student version of Savor with 3% on groceries, dining, entertainment and streaming.', 'https://www.capitalone.com/credit-cards/savor-student/', '2026-10-11', TRUE);

INSERT INTO public.card_rewards (
    card_id, category_id, reward_rate, spend_cap, cap_period, rate_after_cap, notes
)
SELECT card.card_id, category.category_id, reward.reward_rate,
       reward.spend_cap::DECIMAL(10,2), reward.cap_period,
       reward.rate_after_cap::DECIMAL(4,2), reward.notes
FROM (
    VALUES
    ('citi-double-cash', 'other', 2, NULL, NULL, NULL, '1% when you buy + 1% when you pay'),
    ('chase-freedom-unlimited', 'dining', 3, NULL, NULL, NULL, 'Includes takeout and eligible delivery'),
    ('chase-freedom-unlimited', 'other', 1.5, NULL, NULL, NULL, NULL),
    ('wells-fargo-active-cash', 'other', 2, NULL, NULL, NULL, NULL),
    ('amex-blue-cash-everyday', 'groceries', 3, 6000, 'year', 1, 'U.S. supermarkets'),
    ('amex-blue-cash-everyday', 'online_shopping', 3, 6000, 'year', 1, 'U.S. online retail'),
    ('amex-blue-cash-everyday', 'gas', 3, 6000, 'year', 1, 'U.S. gas stations'),
    ('amex-blue-cash-everyday', 'other', 1, NULL, NULL, NULL, NULL),
    ('amex-blue-cash-preferred', 'groceries', 6, 6000, 'year', 1, 'U.S. supermarkets'),
    ('amex-blue-cash-preferred', 'streaming', 6, NULL, NULL, NULL, 'Select U.S. streaming subscriptions'),
    ('amex-blue-cash-preferred', 'gas', 3, NULL, NULL, NULL, 'U.S. gas stations'),
    ('amex-blue-cash-preferred', 'other', 1, NULL, NULL, NULL, NULL),
    ('capital-one-savor', 'groceries', 3, NULL, NULL, NULL, 'Excludes superstores like Walmart and Target'),
    ('capital-one-savor', 'dining', 3, NULL, NULL, NULL, NULL),
    ('capital-one-savor', 'streaming', 3, NULL, NULL, NULL, 'Popular streaming services'),
    ('capital-one-savor', 'other', 1, NULL, NULL, NULL, NULL),
    ('discover-it-cash-back', 'other', 1, NULL, NULL, NULL, 'Plus rotating 5% quarterly categories (not modeled)'),
    ('chase-freedom-flex', 'dining', 3, NULL, NULL, NULL, 'Includes takeout and eligible delivery'),
    ('chase-freedom-flex', 'other', 1, NULL, NULL, NULL, 'Plus rotating 5% on up to $1,500/quarter (not modeled)'),
    ('bofa-customized-cash-rewards', 'groceries', 2, 2500, 'quarter', 1, 'Grocery stores and wholesale clubs; cap is combined with the choice category'),
    ('bofa-customized-cash-rewards', 'other', 1, NULL, NULL, NULL, 'Choice category (3%, 6% in year one) not modeled'),
    ('chase-sapphire-preferred', 'dining', 3, NULL, NULL, NULL, 'Includes takeout and eligible delivery'),
    ('chase-sapphire-preferred', 'gas', 3, NULL, NULL, NULL, 'Gas stations and EV charging'),
    ('chase-sapphire-preferred', 'streaming', 3, NULL, NULL, NULL, 'Select top streaming services'),
    ('chase-sapphire-preferred', 'travel', 2, NULL, NULL, NULL, 'Other travel; 5x via Chase Travel not modeled'),
    ('chase-sapphire-preferred', 'other', 1, NULL, NULL, NULL, NULL),
    ('capital-one-venture', 'other', 2, NULL, NULL, NULL, '5x on hotels/rentals via Capital One Travel not modeled'),
    ('capital-one-ventureone', 'other', 1.25, NULL, NULL, NULL, '5x on hotels/rentals via Capital One Travel not modeled'),
    ('amex-gold', 'dining', 4, 50000, 'year', 1, 'Restaurants worldwide'),
    ('amex-gold', 'groceries', 4, 25000, 'year', 1, 'U.S. supermarkets'),
    ('amex-gold', 'other', 1, NULL, NULL, NULL, NULL),
    ('citi-strata-premier', 'dining', 3, NULL, NULL, NULL, 'Restaurants'),
    ('citi-strata-premier', 'groceries', 3, NULL, NULL, NULL, 'Supermarkets'),
    ('citi-strata-premier', 'gas', 3, NULL, NULL, NULL, 'Gas and EV charging'),
    ('citi-strata-premier', 'travel', 3, NULL, NULL, NULL, 'Air travel and other hotel purchases'),
    ('citi-strata-premier', 'other', 1, NULL, NULL, NULL, NULL),
    ('capital-one-platinum-secured', 'other', 0, NULL, NULL, NULL, 'Card earns no rewards'),
    ('discover-it-secured', 'other', 1, NULL, NULL, NULL, 'Plus rotating 5% quarterly categories (not modeled)'),
    ('capital-one-quicksilver-secured', 'other', 1.5, NULL, NULL, NULL, NULL),
    ('chase-freedom-rise', 'other', 1.5, NULL, NULL, NULL, 'Lyft 2% through 09/30/2027 not modeled'),
    ('discover-it-student-cash-back', 'other', 1, NULL, NULL, NULL, 'Plus rotating 5% quarterly categories (not modeled)'),
    ('capital-one-savor-student', 'groceries', 3, NULL, NULL, NULL, 'Excludes superstores like Walmart and Target'),
    ('capital-one-savor-student', 'dining', 3, NULL, NULL, NULL, NULL),
    ('capital-one-savor-student', 'streaming', 3, NULL, NULL, NULL, 'Popular streaming services'),
    ('capital-one-savor-student', 'other', 1, NULL, NULL, NULL, NULL)
) AS reward(card_slug, category_slug, reward_rate, spend_cap, cap_period, rate_after_cap, notes)
JOIN public.credit_cards AS card ON card.slug = reward.card_slug
JOIN public.reward_categories AS category ON category.slug = reward.category_slug;

INSERT INTO public.card_filters (card_id, filter_id)
SELECT card.card_id, filter.filter_id
FROM (
    VALUES
    ('citi-double-cash', 'popular-cards'),
    ('citi-double-cash', 'cashback'),
    ('chase-freedom-unlimited', 'popular-cards'),
    ('chase-freedom-unlimited', 'cashback'),
    ('wells-fargo-active-cash', 'popular-cards'),
    ('wells-fargo-active-cash', 'cashback'),
    ('amex-blue-cash-everyday', 'cashback'),
    ('amex-blue-cash-preferred', 'cashback'),
    ('capital-one-savor', 'cashback'),
    ('discover-it-cash-back', 'cashback'),
    ('chase-freedom-flex', 'cashback'),
    ('bofa-customized-cash-rewards', 'cashback'),
    ('chase-sapphire-preferred', 'popular-cards'),
    ('capital-one-venture', 'popular-cards'),
    ('capital-one-platinum-secured', 'new-to-credit'),
    ('discover-it-secured', 'cashback'),
    ('discover-it-secured', 'new-to-credit'),
    ('capital-one-quicksilver-secured', 'cashback'),
    ('capital-one-quicksilver-secured', 'new-to-credit'),
    ('chase-freedom-rise', 'cashback'),
    ('chase-freedom-rise', 'new-to-credit'),
    ('discover-it-student-cash-back', 'cashback'),
    ('discover-it-student-cash-back', 'new-to-credit'),
    ('capital-one-savor-student', 'cashback'),
    ('capital-one-savor-student', 'new-to-credit')
) AS assignment(card_slug, filter_slug)
JOIN public.credit_cards AS card ON card.slug = assignment.card_slug
JOIN public.filters AS filter ON filter.slug = assignment.filter_slug;

INSERT INTO public.card_benefits (card_id, description, sort_order)
SELECT card.card_id, benefit.description, benefit.sort_order
FROM (
    VALUES
    ('citi-double-cash', 'No categories to track or enroll in', 1),
    ('citi-double-cash', '$0 liability for unauthorized charges', 2),
    ('citi-double-cash', 'Access to Citi Entertainment presales', 3),
    ('chase-freedom-unlimited', '0% intro APR for 15 months', 1),
    ('chase-freedom-unlimited', 'Purchase protection for 120 days, up to $500 per item', 2),
    ('chase-freedom-unlimited', 'Extended warranty adds one year', 3),
    ('wells-fargo-active-cash', 'Cell phone protection up to $600 ($25 deductible)', 1),
    ('wells-fargo-active-cash', '0% intro APR for 12 months', 2),
    ('wells-fargo-active-cash', 'Rental car collision damage waiver', 3),
    ('amex-blue-cash-everyday', 'Up to $7/month back on qualifying Disney streaming subscriptions', 1),
    ('amex-blue-cash-everyday', 'Purchase protection up to $1,000 per purchase', 2),
    ('amex-blue-cash-everyday', 'Use rewards at Amazon.com checkout', 3),
    ('amex-blue-cash-preferred', 'Up to $10/month back on eligible Disney streaming subscriptions', 1),
    ('amex-blue-cash-preferred', 'Return protection up to 90 days', 2),
    ('amex-blue-cash-preferred', 'No annual fee in the first year', 3),
    ('capital-one-savor', 'No foreign transaction fees', 1),
    ('capital-one-savor', 'Rewards never expire and can be redeemed in any amount', 2),
    ('capital-one-savor', '0% intro APR for 12 months', 3),
    ('discover-it-cash-back', 'First-year Cashback Match with no cap', 1),
    ('discover-it-cash-back', '0% intro APR for 15 months', 2),
    ('discover-it-cash-back', 'Lock your card in the app', 3),
    ('chase-freedom-flex', 'No foreign transaction fees', 1),
    ('chase-freedom-flex', 'Trip cancellation/interruption insurance', 2),
    ('chase-freedom-flex', 'Purchase protection for 120 days, up to $500 per item', 3),
    ('bofa-customized-cash-rewards', 'Change your 3% category once a month', 1),
    ('bofa-customized-cash-rewards', '0% intro APR for 15 billing cycles', 2),
    ('bofa-customized-cash-rewards', 'Rewards don''t expire while the account is open', 3),
    ('chase-sapphire-preferred', '$100 yearly hotel credit via Chase Travel', 1),
    ('chase-sapphire-preferred', 'Transfer points to airline and hotel partners', 2),
    ('chase-sapphire-preferred', 'Trip cancellation/interruption insurance', 3),
    ('capital-one-venture', 'Up to $120 credit for Global Entry or TSA PreCheck', 1),
    ('capital-one-venture', 'Transfer miles to 15+ travel programs', 2),
    ('capital-one-venture', 'No foreign transaction fees', 3),
    ('capital-one-ventureone', 'No annual fee and no foreign transaction fees', 1),
    ('capital-one-ventureone', 'Miles don''t expire for the life of the account', 2),
    ('capital-one-ventureone', '0% intro APR for 15 months', 3),
    ('amex-gold', 'Up to $120/year in dining credits (enrollment required)', 1),
    ('amex-gold', 'Up to $120/year in Uber Cash', 2),
    ('amex-gold', 'No foreign transaction fees', 3),
    ('citi-strata-premier', '$100 off one $500+ hotel stay per year via Citi Travel', 1),
    ('citi-strata-premier', 'Transfer points to airline and hotel partners', 2),
    ('citi-strata-premier', 'No foreign transaction fees', 3),
    ('capital-one-platinum-secured', 'Refundable deposit from $49', 1),
    ('capital-one-platinum-secured', 'Possible upgrade to an unsecured card', 2),
    ('capital-one-platinum-secured', 'Reports to all three credit bureaus', 3),
    ('discover-it-secured', 'Refundable deposit from $49', 1),
    ('discover-it-secured', 'Path to the unsecured Discover it card', 2),
    ('discover-it-secured', 'First-year Cashback Match', 3),
    ('capital-one-quicksilver-secured', 'Refundable deposit; possible upgrade to unsecured Quicksilver', 1),
    ('capital-one-quicksilver-secured', 'No foreign transaction fees', 2),
    ('capital-one-quicksilver-secured', '$0 fraud liability', 3),
    ('chase-freedom-rise', 'Yearly review for an upgrade to Freedom Unlimited', 1),
    ('chase-freedom-rise', 'Rewards don''t expire while the account is open', 2),
    ('chase-freedom-rise', 'Purchase protection for 120 days, up to $500 per item', 3),
    ('discover-it-student-cash-back', 'First-year Cashback Match', 1),
    ('discover-it-student-cash-back', '0% intro APR on purchases for 6 months', 2),
    ('discover-it-student-cash-back', '$0 fraud liability', 3),
    ('capital-one-savor-student', 'No foreign transaction fees', 1),
    ('capital-one-savor-student', 'Rewards never expire', 2),
    ('capital-one-savor-student', 'Open to students at 4-year and community colleges', 3)
) AS benefit(card_slug, description, sort_order)
JOIN public.credit_cards AS card ON card.slug = benefit.card_slug;

COMMIT;
