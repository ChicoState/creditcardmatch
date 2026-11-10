import { AuthForm } from '../../components/auth-form';
import { createAuthServerClient } from '../../lib/auth/server';
import { redirect } from 'next/navigation';

interface SignupPageProps {
  searchParams?: Promise<{ next?: string }>;
}

export default async function SignupPage({
  searchParams,
}: SignupPageProps = {}) {
  const { data } = await (await createAuthServerClient()).auth.getUser();
  if (data.user) redirect('/');
  const params = searchParams ? await searchParams : {};

  return (
    <main className="page-shell narrow-page">
      <section className="auth-page">
        <p className="eyebrow">Account</p>
        <h1>Create account</h1>
        <p className="auth-page__intro">
          Choose a username for your CreditCardMatch account.
        </p>
        <AuthForm mode="signup" next={params.next} />
      </section>
    </main>
  );
}
