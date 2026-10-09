import Link from 'next/link';

export default function SignupPage() {
  return (
    <main className="page-shell narrow-page">
      <section className="placeholder-page">
        <p className="eyebrow">Account</p>
        <h1>Sign up</h1>
        <p>Email and password signup will be connected in Phase 2.</p>
        <Link href="/login">Already have an account? Log in</Link>
      </section>
    </main>
  );
}
