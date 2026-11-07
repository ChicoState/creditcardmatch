import { AuthForm } from '../../components/auth-form';
import { createAuthServerClient } from '../../lib/auth/server';
import { redirect } from 'next/navigation';

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { data } = await (await createAuthServerClient()).auth.getUser();
  if (data.user) redirect('/');
  const { next } = await searchParams;

  return (
    <main className="page-shell narrow-page">
      <section className="auth-page">
        <p className="eyebrow">Account</p>
        <h1>Login</h1>
        <p className="auth-page__intro">
          Use your username and password to continue.
        </p>
        <AuthForm mode="login" next={next} />
      </section>
    </main>
  );
}
