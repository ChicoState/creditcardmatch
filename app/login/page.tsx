import { AuthForm } from '../../components/auth-form';
import { createAuthServerClient } from '../../lib/auth/server';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const { data } = await (await createAuthServerClient()).auth.getUser();
  if (data.user) redirect('/');

  return (
    <main className="page-shell narrow-page">
      <section className="auth-page">
        <p className="eyebrow">Account</p>
        <h1>Login</h1>
        <p className="auth-page__intro">
          Use your username and password to continue.
        </p>
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
