import Link from 'next/link';
import { AccountRoster } from '../../../components/account-roster';
import { getCurrentCardsPageData } from '../../../lib/account/data';

export default async function CurrentCardsPage() {
  const account = await getCurrentCardsPageData();

  return (
    <main className="page-shell narrow-page">
      <h1>Current Cards</h1>
      <Link href="/card-requests/new">Request a missing card</Link>
      <AccountRoster
        initialRoster={account.roster}
        availableCards={account.availableCards}
        rewardCategories={account.rewardCategories}
      />
    </main>
  );
}
