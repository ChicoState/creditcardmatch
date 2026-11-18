import { redirect } from 'next/navigation';
import { AccountDetails } from '../../components/account-details';
import { SavedSurveySection } from '../../components/saved-survey-section';
import { createAuthServerClient } from '../../lib/auth/server';
import { getSavedSurveyAnswers } from '../../lib/account/data';
import { accountAvatarUrl } from '../../lib/account/server';
import './account.css';

export default async function AccountPage() {
  const auth = await createAuthServerClient();
  const {
    data: { user },
    error,
  } = await auth.auth.getUser();
  if (error || !user) redirect('/login');
  const email = user.user_metadata.contact_email;
  const savedSurvey = await getSavedSurveyAnswers();
  return (
    <main className="page-shell account-page">
      <h1>Account details</h1>
      <p className="account-intro">
        Manage your password, contact email, and profile photo.
      </p>
      <AccountDetails
        username={
          typeof user.user_metadata.username === 'string'
            ? user.user_metadata.username
            : ''
        }
        email={typeof email === 'string' ? email : ''}
        avatarUrl={await accountAvatarUrl(user, auth)}
      />
      <SavedSurveySection savedSurvey={savedSurvey} />
    </main>
  );
}
