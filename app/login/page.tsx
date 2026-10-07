import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="page-shell narrow-page">
      <section className="placeholder-page">
        <p className="eyebrow">Account</p>
        <h1>Log in</h1>
        <p>Email and password login will be connected in Phase 2.</p>
        <Link href="/signup">Need an account? Sign up</Link>
      </section>
    </main>
  );
}
