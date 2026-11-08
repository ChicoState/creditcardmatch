import { AccountRoster } from '../../../components/account-roster';
import { getCurrentCardsPageData } from '../../../lib/account/data';

export default async function CurrentCardsPage() {
  const account = await getCurrentCardsPageData();

  return (
    <main className="page-shell narrow-page">
      <h1>Current Cards</h1>
      <AccountRoster
        initialRoster={account.roster}
        availableCards={account.availableCards}
        rewardCategories={account.rewardCategories}
      />
    </main>
  );
}
