import { redirect } from 'next/navigation';
import { AccountDetails } from '../../components/account-details';
import { createAuthServerClient } from '../../lib/auth/server';
import { accountAvatarUrl, accountName } from '../../lib/account/server';
import './account.css';

export default async function AccountPage() {
  const auth = await createAuthServerClient();
  const {
    data: { user },
    error,
  } = await auth.auth.getUser();
  if (error || !user) redirect('/login');
  const email = user.user_metadata.contact_email;
  return (
    <main className="page-shell account-page">
      <h1>Account details</h1>
      <p className="account-intro">
        Manage your name, contact email, and profile photo.
      </p>
      <AccountDetails
        name={accountName(user)}
        email={typeof email === 'string' ? email : ''}
        avatarUrl={await accountAvatarUrl(user, auth)}
      />
    </main>
  );
}
