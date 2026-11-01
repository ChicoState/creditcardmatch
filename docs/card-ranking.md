# Card ranking system

## Purpose

Survey results should help users compare cards by how well they fit their
categories, spending habits, credit range, and preferences. The ranking is a
comparison aid, not an approval decision or a recommendation to apply.

## Two results modes

The results page supports two distinct modes.

### Normal browsing

Normal browsing is used when a visitor opens the catalog directly or applies
filters without completing the survey.

- Apply the selected catalog filters.
- Keep the catalog order neutral.
- Do not load saved survey answers for ranking.
- Do not display match-rating badges.
- Explain only which active filters a card matches.

Example:

> Matches the active filter: Cashback.

### Survey results

The survey redirects to results with an explicit `mode=survey` parameter. This
prevents previously saved browser answers from changing ordinary catalog
browsing.

Survey results:

- Apply the survey-derived filters.
- Rank the remaining cards using the saved survey answers.
- Display score-reason bullets for each evaluated dimension.
- Show `Best match` and `Okay` badges when applicable.
- Do not show an `Alternative` badge.

## Feature slices and decisions

The ranking work is intentionally split into small changes so each behavior
can be evaluated and committed separately.

### Slice 1: Explain category influence and spending status — implemented

This slice clarifies the existing ranking output without changing scores,
weights, thresholds, or card ordering.

The `How to read your results` section briefly states the category context:

- `No spending categories were selected.`
- `Selected spending categories influenced this ranking.`
- `No matching category rewards were found.`

Each card's `Why this rating` section keeps all ranking reasons and uses
shorter, more specific spending messages:

- `No monthly amount was provided.` when a supported category has no positive
  amount.
- `Monthly spending is not supported for this category.` when the selected
  category does not support monthly spending yet.
- `Monthly spending is not supported for some selected categories.` when a
  selection mixes supported and unsupported categories.
- `Monthly spending: fits this card’s reward structure` when the amount is
  available and used.

The distinction matters because an omitted amount is a user-input situation,
while an unsupported category is a catalog capability limitation. Neither
case should be described as if the user made an incorrect choice.

### Slice 2: Add extra-benefit scoring — implemented

Benefits such as purchase protection and travel benefits provide a small
scoring bonus only when the catalog contains explicit evidence for the
benefit. The current catalog stores benefit descriptions as text, so the
ranking layer recognizes only narrowly defined evidence patterns.

The bonus is intentionally weaker than category, spending, and major credit
signals. It may separate otherwise similar cards but must not override a
direct category match or a significant credit mismatch.

The explanation adds a short reason only for confirmed matches, such as:

> Purchase protection: included.

Unknown catalog data is neutral: it gives no bonus, creates no penalty, and
does not add a negative explanation. Benefits without confirmed evidence,
including the current balance-transfer and welcome-bonus selections, do not
affect ranking. This prevents incomplete catalog records from unfairly
lowering a card's ranking.

### Slice 3: Separate goal-based and category-focused results — implemented

Users who select no spending categories receive useful results
based on their primary goal, credit range, and annual-fee preference. These
results will keep the existing `Best match` and `Okay` labels so the visual
language remains consistent.

The ranking model records the distinction internally, while the explanation
makes it clear without introducing separate technical terminology:

> No spending categories were selected.

When categories are selected, category rewards and supported spending amounts
are part of the explanation. When selected categories have no matching
rewards, cards continue to be presented as `Broader option` results.

This separates an intentional goal-based search from a category search that
had to fall back to broader cards, without making users learn a new ranking
system.

### Stretch goal: Supplement explicit mappings with inference — deferred

The current explicit mappings in `lib/catalog/filter-definitions.ts` remain
the source of truth. A future grep-like inference system may supplement those
mappings for straightforward cases, but it should not replace explicit
mappings where survey language is ambiguous or catalog meaning requires
product judgment.

Inference is deferred so ranking behavior remains predictable while the core
result explanations and scoring changes are evaluated.

## Category and spending rules

Selected priority categories represent the user's interests. A monthly
spending amount is an additional signal only when the category supports saved
spending and the user provides a positive amount.

Category matching follows these rules:

- Reward categories must use normalized slugs such as `groceries`, `dining`,
  and `travel`.
- Survey category labels may use aliases that resolve to one or more catalog
  slugs. The current aliases include `shopping` → `online_shopping`,
  `streaming-entertainment` → `streaming`, and `everyday-purchases` → `other`.
- Structured reward-category data determines ranking; free-form descriptions
  and benefit text do not.
- Any overlap between a user category and a card reward category keeps the card
  eligible for display.
- Higher-spend categories contribute more to the score than lower-spend
  categories.
- A card with no category overlap is hidden when at least one category-matching
  card exists.
- If no cards overlap the user’s categories, broader cards are shown as
  `Broader option` results instead of showing an empty result page.

Spending fit should use the card’s structured reward information when
available, including reward rate, spending caps, cap periods, and any rate
after a cap. The intended calculation estimates how well the card rewards the
user’s reported spending rather than treating every category match equally.

## Credit-score rules

Credit compatibility is a ranking signal, not a visibility filter.

- A card within the user’s confirmed credit range receives full credit-fit
  value.
- A card outside the range remains visible but receives a meaningful penalty.
- An unknown credit range receives partial credit-fit value.
- A card cannot receive `Best match` unless the user’s credit fit is confirmed.
- The score explanation must state when the credit range is unknown or outside
  the preferred range.

This allows users to explore cards outside their current range without making
those cards appear equally suitable to cards that fit their confirmed range.

## Other preferences

Annual-fee preference is a soft ranking signal:

- A card that follows the user’s annual-fee preference receives a higher score.
- A conflicting annual fee lowers the score.
- Annual-fee conflict does not hide the card.

Income answers do not affect ranking. Confirmed extra-benefit evidence can add
the small bonus described in Slice 2; unknown benefit data remains neutral.

## Score and ratings

The score combines these dimensions:

1. Category overlap.
2. Spending fit and estimated reward value.
3. Credit-range fit.
4. Annual-fee and other supported preferences.

Category overlap and spending fit are the strongest signals. Credit fit is a
meaningful signal but remains soft so it cannot prevent exploration. Preference
signals such as annual-fee fit have less influence than category and spending
fit.

The exact numeric weights and rating thresholds must be calibrated with
representative catalog fixtures before being treated as product policy.

### Display behavior

- `Best match`: the card meets the best-match threshold and has confirmed
  credit compatibility. Category and spending fit are meaningful signals in
  category-focused mode; goal, credit, annual-fee, and confirmed-benefit fit
  are used in goal-based mode.
- `Okay`: the card has some useful fit, but has weaker category, spending,
  credit, or preference alignment. Unknown credit range belongs here rather
  than in `Best match`.
- `Review fit`: the card remains available but does not meet the `Okay`
  threshold; the reason bullets explain the tradeoffs.
- `Broader option`: no direct category match was available, so the card is
  shown for comparison based on other supported signals.

Multiple cards may receive `Best match` when they tie or all meet the approved
threshold. The system should not arbitrarily label only one card as best.

## Score explanations

Survey-result cards use short bullets instead of a paragraph. Show one bullet
for every evaluated dimension, including positive, negative, and unknown
factors.

Examples:

- `Category match: Groceries.`
- `No spending categories were selected.`
- `No matching category rewards were found.`
- `No monthly amount was provided.`
- `Monthly spending is not supported for this category.`
- `Monthly spending: fits this card’s reward structure`
- `Credit range: confirmed fit`
- `Credit range: unknown, so this card is rated Okay`
- `Annual fee: does not match your preference`

Broader fallback cards should explain why they are present:

> Shown as a broader option because no selected-category matches were
> available.

## Data contract

The current database already stores reward categories and card rewards in
separate records. The `CatalogCard` projection must combine them into
structured card data before ranking, for example:

```ts
interface CardRewardCategory {
  categorySlug: string;
  rewardRate: number;
  spendCap: number | null;
  capPeriod: 'month' | 'quarter' | 'year' | null;
  rateAfterCap: number | null;
}
```

The ranking layer should receive filtered `CatalogCard` values and should not
own catalog filtering. This keeps the ranking work independent from changes to
the filtering implementation.

## Out of scope

- Making credit compatibility a hard filter.
- Hiding every card with a score below the best-match threshold.
- Ranking from free-form descriptions or benefit text.
- Using income or extra-benefit answers without normalized catalog data.
- Making normal catalog browsing depend on saved survey answers.
- Treating the ranking as a guarantee of approval or eligibility.
