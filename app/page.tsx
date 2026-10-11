import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
	return (
		<main className="page-shell landing-page">
			<section className="landing-hero" aria-labelledby="landing-heading">
				<h1 id="landing-heading">Find the card that&apos;s right for you!</h1>
				<div className="landing-choices">
					<section className="landing-column">
						<h2>Popular Categories:</h2>
						<div className="popular-category-buttons">
							<Link
								className="secondary-action"
								href="/results?filters=popular-cards"
							>
								📈 Popular cards
							</Link>
							<Link
								className="secondary-action"
								href="/results?filters=travel-cards"
							>
								✈️ Travel cards
							</Link>
							<Link
								className="secondary-action"
								href="/results?filters=gas-cards"
							>
								⛽ Gas cards
							</Link>
							<Link
								className="secondary-action"
								href="/results?filters=cashback"
							>
								💰 Cashback cards
							</Link>
						</div>
					</section>

					<section className="landing-column landing-survey-column">
						<h2>Take our survey for personalized recommendations:</h2>
						<Link className="primary-action" href="/survey">
							SURVEY
						</Link>
					</section>

					<section className="landing-column">
						<h2>Want a blank slate?</h2>
						<Link className="primary-action" href="/results">
							START FRESH
						</Link>
					</section>
				</div>

				<Link className="learn-link" href="/learn">
					Learn more about cards!
				</Link>
			</section>
		</main>
	);
}
