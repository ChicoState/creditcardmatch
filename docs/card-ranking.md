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

## Category and spending rules

The survey requires a positive monthly spending estimate for every selected
priority category. A selected category therefore always represents both an
interest and a spending signal.

Category matching follows these rules:

- Reward categories must use normalized slugs such as `groceries`, `dining`,
  and `travel`.
- Structured reward-category data determines ranking; free-form descriptions
  and benefit text do not.
- Any overlap between a user category and a card reward category keeps the card
  eligible for display.
- Higher-spend categories contribute more to the score than lower-spend
  categories.
- A card with no category overlap is hidden when at least one category-matching
  card exists.
- If no cards overlap the user’s categories, broader cards are shown as
  unbadged options instead of showing an empty result page.

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

Income and extra-benefit answers should not affect ranking until the catalog
contains reliable normalized data for them.

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

- `Best match`: the card meets the best-match threshold, has meaningful
  category and spending fit, and has confirmed credit compatibility.
- `Okay`: the card has some useful fit, but has weaker category, spending,
  credit, or preference alignment. Unknown credit range belongs here rather
  than in `Best match`.
- Lower-scoring cards: remain available when the visibility rules permit them,
  but receive no `Alternative` badge.

Multiple cards may receive `Best match` when they tie or all meet the approved
threshold. The system should not arbitrarily label only one card as best.

## Score explanations

Survey-result cards use short bullets instead of a paragraph. Show one bullet
for every evaluated dimension, including positive, negative, and unknown
factors.

Examples:

- `Groceries: strong category match`
- `Monthly spending: fits this card’s reward structure`
- `Credit range: confirmed fit`
- `Credit range: unknown, so this card is rated Okay`
- `Annual fee: does not match your preference`
- `Travel: no matching rewards`

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
