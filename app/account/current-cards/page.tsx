import { AccountRoster } from '../../../components/account-roster';
import { getAccountDashboardData } from '../../../lib/account/data';

export default async function CurrentCardsPage() {
  const account = await getAccountDashboardData();

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
