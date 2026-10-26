"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type {
	ComparisonCard,
	ComparisonReward,
} from "../lib/catalog/comparison";
import styles from "./comparison.module.css";
import { ComparisonCart } from "./comparison-cart";
import { useComparison } from "./comparison-provider";

function money(value: number | null): string {
	return value === null
		? "Not listed"
		: new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
				maximumFractionDigits: 2,
				minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
			}).format(value);
}

function rewardRate(rate: number, type: ComparisonCard["rewardType"]): string {
	if (type === "cashback") return `${rate}% cash back`;
	if (type === "points")
		return `${rate} ${rate === 1 ? "point" : "points"} per $1`;
	if (type === "miles")
		return `${rate} ${rate === 1 ? "mile" : "miles"} per $1`;
	return "Not listed";
}

function RewardTerms({
	reward,
	card,
}: {
	reward: ComparisonReward | undefined;
	card: ComparisonCard;
}) {
	if (card.rewardType === "none") return <>No rewards</>;
	if (!reward) return <>Not listed</>;
	return (
		<>
			<strong>{rewardRate(reward.rate, card.rewardType)}</strong>
			{reward.spendCap !== null && (
				<p>
					On up to {money(reward.spendCap)} in spending
					{reward.capPeriod
						? ` per ${reward.capPeriod}`
						: " (cap period not listed)"}
					.
				</p>
			)}
			{reward.rateAfterCap !== null && (
				<p>Then {rewardRate(reward.rateAfterCap, card.rewardType)}.</p>
			)}
			{reward.notes && <p>{reward.notes}</p>}
		</>
	);
}

const rewardTypes = {
	cashback: "Cash back",
	points: "Points",
	miles: "Miles",
	none: "No rewards",
};
const creditLevels = {
	none: "No credit history",
	fair: "Fair",
	good: "Good",
	excellent: "Excellent",
};
const details: {
	label: string;
	render: (card: ComparisonCard) => ReactNode;
}[] = [
	{
		label: "What it's good for",
		render: (card) => card.description || "Not listed",
	},
	{
		label: "Annual fee",
		render: (card) =>
			card.annualFeeWaivedFirstYear
				? `$0 first year; ${money(card.annualFee)}/year after`
				: `${money(card.annualFee)}/year`,
	},
	{
		label: "Reward type",
		render: (card) =>
			card.rewardType ? rewardTypes[card.rewardType] : "Not listed",
	},
	{
		label: "Point or mile value",
		render: (card) =>
			card.pointValueCents === null
				? "Not listed"
				: `${card.pointValueCents} ${card.pointValueCents === 1 ? "cent" : "cents"}`,
	},
	{
		label: "Introductory offer",
		render: (card) => card.introOffer || "Not listed",
	},
	{
		label: "Benefits",
		render: (card) =>
			card.benefits.length ? (
				<ul>
					{card.benefits.map((benefit) => (
						<li key={benefit}>{benefit}</li>
					))}
				</ul>
			) : (
				"Not listed"
			),
	},
	{ label: "One-time fee", render: (card) => money(card.oneTimeFee) },
	{
		label: "Monthly fee",
		render: (card) =>
			card.monthlyFee === null
				? "Not listed"
				: `${money(card.monthlyFee)}/month`,
	},
	{
		label: "Foreign transaction fee",
		render: (card) =>
			card.foreignTransactionFeePercent === null
				? "Not listed"
				: `${card.foreignTransactionFeePercent}%`,
	},
	{
		label: "Credit requirement",
		render: (card) =>
			card.creditLevelRequired
				? creditLevels[card.creditLevelRequired]
				: "Not listed",
	},
	{
		label: "Card type",
		render: (card) => (card.isSecured ? "Secured" : "Unsecured"),
	},
	{
		label: "Minimum security deposit",
		render: (card) =>
			card.isSecured ? money(card.securityDepositMin) : "Not applicable",
	},
	{
		label: "Network",
		render: (card) =>
			card.network === "amex"
				? "American Express"
				: card.network
					? card.network[0].toUpperCase() + card.network.slice(1)
					: "Not listed",
	},
];

export function ComparisonView({ cards }: { cards: ComparisonCard[] }) {
	const { ids, ready, toggle } = useComparison();
	const selected = ids.flatMap(
		(id) => cards.find((card) => card.cardId === id) ?? [],
	);
	const categories = [
		...new Map(
			selected
				.flatMap((card) => card.rewards)
				.map((reward) => [reward.categoryId, reward]),
		).values(),
	].sort((a, b) => a.displayOrder - b.displayOrder);
  return (
    <>
      {!ready ? (
        <p role="status">Loading your comparison…</p>
      ) : selected.length === 0 ? (
        <section className={styles.empty}>
          <h2>Start with a card that interests you.</h2>
          <p>
            Add up to four cards from the catalog to compare rewards, fees, and
            benefits.
          </p>
          <Link className="primary-action" href="/results">
            Browse all cards
          </Link>
        </section>
      ) : (
        <>
          <div className={styles.compareToolbar}>
            <p>
              {selected.length === 1
                ? 'Add another card to see the differences side by side.'
                : `${selected.length} cards. See where each one fits.`}
            </p>
            <Link className="secondary-action" href="/results">
              Add more cards
            </Link>
          </div>

          <p className={styles.hint} id="comparison-scroll-hint">
            On smaller screens, scroll the table sideways to see every card.
          </p>

          <div
            aria-label="Scrollable card comparison"
            aria-describedby="comparison-scroll-hint"
            className={styles.tableScroll}
            role="region"
            tabIndex={0}
          >
            <table className={styles.table}>
              <caption className={styles.caption}>Card comparison</caption>
              <thead>
                <tr>
                  <th scope="col">At a glance</th>
                  {selected.map((card) => (
                    <th key={card.cardId} scope="col">
                      <div className={styles.cardIssuerRow}>
                        <p className={styles.issuer}>{card.issuer}</p>
                        <button
                          className={styles.removeButton}
                          onClick={() => toggle(card.cardId)}
                          aria-label={`Remove ${card.cardName}`}
                          type="button"
                        >
                          X
                        </button>
                      </div>
                      <h2>{card.cardName}</h2>
                      {!card.isVerified && (
                        <span className="unverified-label">Unverified</span>
                      )}
                      <ApplyLink card={card} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {details.slice(0, 3).map(({ label, render }) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {selected.map((card) => (
                      <td key={card.cardId}>{render(card)}</td>
                    ))}
                  </tr>
                ))}

                {categories.map((category) => (
                  <tr key={category.categoryId}>
                    <th scope="row">{category.categoryName}</th>
                    {selected.map((card) => (
                      <td key={card.cardId}>
                        <RewardTerms
                          card={card}
                          reward={card.rewards.find(
                            (reward) =>
                              reward.categoryId === category.categoryId,
                          )}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                {details.slice(3).map(({ label, render }) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {selected.map((card) => (
                      <td key={card.cardId}>{render(card)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className={styles.hint}>
            “Not listed” means the catalog does not include that detail. It does
            not mean a fee is $0 or a benefit is unavailable.
          </p>
        </>
      )}
    </>
  );
}