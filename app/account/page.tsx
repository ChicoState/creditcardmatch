import { getAccountDashboardData } from '../../lib/account/data';

export default async function AccountPage() {
  const account = await getAccountDashboardData();

  return (
    <main className="page-shell narrow-page">
      <h1>Account details</h1>
      <section aria-labelledby="username-heading" className="account-section">
        <p className="eyebrow">Profile</p>
        <h2 id="username-heading">Username</h2>
        <p>{account.username}</p>
      </section>
    </main>
  );
}
