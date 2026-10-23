import { AuthForm } from '../../components/auth-form';
import { createAuthServerClient } from '../../lib/auth/server';
import { redirect } from 'next/navigation';

export default async function SignupPage() {
  const { data } = await (await createAuthServerClient()).auth.getUser();
  if (data.user) redirect('/');

  return (
    <main className="page-shell narrow-page">
      <section className="auth-page">
        <p className="eyebrow">Account</p>
        <h1>Create account</h1>
        <p className="auth-page__intro">
          Choose a username for your CreditCardMatch account.
        </p>
        <AuthForm mode="signup" />
      </section>
    </main>
  );
}
