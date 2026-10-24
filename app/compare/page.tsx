import Link from "next/link";
import { ComparisonView } from "../../components/comparison-view";
import { selectComparisonCards } from "../../lib/catalog/comparison";
import { getCatalogData } from "../../lib/data/catalog";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
	const cards = selectComparisonCards(await getCatalogData());
	return (
		<main className="page-shell">
			<header className="page-intro">
				<h1>Compare cards</h1>
				<Link className="text-link" href="/results">
					View all cards
				</Link>
			</header>
			<ComparisonView cards={cards} />
		</main>
	);
}
