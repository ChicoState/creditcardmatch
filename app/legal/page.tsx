import Link from 'next/link';

const cfpbDebtGuide =
  'https://www.consumerfinance.gov/data-research/credit-card-data/know-you-owe-credit-cards/';
const cfpbInterest =
  'https://www.consumerfinance.gov/ask-cfpb/how-does-my-credit-card-company-calculate-the-amount-of-interest-i-owe-en-51/';
const cfpbGarnishment =
  'https://www.consumerfinance.gov/ask-cfpb/can-a-debt-collector-take-or-garnish-my-wages-or-benefits-en-1439/';
const cfpbLawsuit =
  'https://www.consumerfinance.gov/ask-cfpb/what-should-i-do-if-im-sued-by-a-debt-collector-or-creditor-en-334/';
const ftcDebtCollection =
  'https://consumer.ftc.gov/articles/debt-collection-faqs';
const ftcIdentityTheft =
  'https://consumer.ftc.gov/articles/what-do-if-your-identity-stolen';
const usCourtsBankruptcy =
  'https://www.uscourts.gov/court-programs/bankruptcy/bankruptcy-basics/discharge-bankruptcy-bankruptcy-basics';

function SourceLink({
  href,
  children,
}: Readonly<{ href: string; children: string }>) {
  return (
    <a href={href} rel="noreferrer" target="_blank">
      {children}
    </a>
  );
}

export default function LegalPage() {
  return (
    <main className="page-shell disclaimer-page">
      <header className="page-intro disclaimer-intro">
        <p className="eyebrow">Please read before applying</p>
        <h1>Before you use a credit card</h1>
        <p>
          Credit cards can be useful tools, but they are also a form of
          borrowing. If you cannot repay what you charge, interest, fees, and
          collection activity can make a balance much harder to manage.
        </p>
      </header>

      <aside aria-labelledby="boundary-heading" className="disclaimer-boundary">
        <p className="eyebrow">Our role</p>
        <h2 id="boundary-heading">Independent information, not a promise</h2>
        <p>
          CreditCardMatch is an independent, informational tool. This website
          does not issue cards, make approval decisions, negotiate with
          creditors, or earn referral compensation. Recommendations are not
          guarantees, and card terms can change.
        </p>
        <p>
          Nothing here is legal, financial, tax, or credit-repair advice. No
          disclaimer can remove responsibilities imposed by law. You are
          responsible for deciding whether to apply, what to charge, and how to
          repay it. Check the issuer&apos;s current disclosures and terms before
          acting.
        </p>
      </aside>

      <section
        aria-labelledby="safer-heading"
        className="disclaimer-section disclaimer-close"
      >
        <div className="section-heading">
          <p className="eyebrow">Before you apply</p>
          <h2 id="safer-heading">A safer way to compare</h2>
        </div>
        <ul className="safety-list">
          <li>
            Read the issuer&apos;s current APR, fee schedule, and promotional
            terms.
          </li>
          <li>Plan how you will repay purchases before charging them.</li>
          <li>
            Do not borrow for essentials if repayment would put your budget at
            risk.
          </li>
          <li>
            Protect your card and account information, and report suspicious
            activity quickly.
          </li>
          <li>
            Get qualified help if debt, collection calls, or legal notices are
            overwhelming.
          </li>
        </ul>
        <p>
          Use the matcher as a starting point, not a substitute for reading the
          offer. <Link href="/learn">Review the credit card FAQ</Link> or return
          to <Link href="/results">your card matches</Link>.
        </p>
      </section>

      <section aria-labelledby="costs-heading" className="disclaimer-section">
        <div className="section-heading">
          <p className="eyebrow">The everyday risks</p>
          <h2 id="costs-heading">The costs can add up</h2>
        </div>
        <div className="risk-grid">
          <article className="risk-card">
            <h3>Interest is real borrowing cost</h3>
            <p>
              APR is the price of borrowing. When you carry a balance, interest
              can be calculated using the card&apos;s method and transaction
              type. A high APR can make a balance grow even while you make
              payments.
            </p>
            <SourceLink href={cfpbInterest}>
              Read CFPB interest guidance
            </SourceLink>
          </article>
          <article className="risk-card">
            <h3>Minimum payments can stretch debt</h3>
            <p>
              The minimum keeps an account from immediately becoming past due,
              but paying only the minimum may leave you paying interest for a
              long time. A late payment can mean fees, credit damage, a higher
              penalty APR, or loss of a promotional rate.
            </p>
            <SourceLink href={cfpbDebtGuide}>
              Read CFPB payment guidance
            </SourceLink>
          </article>
          <article className="risk-card">
            <h3>Fees and special transactions</h3>
            <p>
              Annual fees, late fees, balance-transfer fees, foreign-transaction
              fees, and cash-advance fees vary by card. Cash advances may begin
              accruing interest without the same grace period as purchases, and
              a balance transfer is not free just because its promotional APR is
              low.
            </p>
            <SourceLink href={cfpbDebtGuide}>
              Compare the issuer&apos;s disclosures
            </SourceLink>
          </article>
          <article className="risk-card">
            <h3>Credit and identity consequences</h3>
            <p>
              Missed payments, high balances, and accounts sent to collections
              can hurt your credit history. Lost card details or identity theft
              can create unauthorized charges and extra work to protect your
              accounts.
            </p>
            <SourceLink href={ftcIdentityTheft}>
              Read FTC identity-theft steps
            </SourceLink>
          </article>
        </div>
      </section>

      <section aria-labelledby="legal-heading" className="disclaimer-section">
        <div className="section-heading">
          <p className="eyebrow">The serious possibilities</p>
          <h2 id="legal-heading">When debt becomes a legal problem</h2>
        </div>
        <div className="disclaimer-copy">
          <p>
            If an account remains unpaid, it may be sent to collections. A
            collector or creditor may sue. Ignoring court papers can allow a
            judgment to be entered without your side being heard, and a judgment
            can add lawful interest, fees, or collection costs.
          </p>
          <p>
            Depending on the debt, the court process, and applicable federal and
            state law, a judgment creditor may be able to garnish some wages or
            take money from a bank account. Wage garnishment is not automatic
            for every unpaid card balance, and exemptions and limits may apply.
            If you receive legal papers, respond by the deadline and consider
            qualified legal help.
          </p>
          <p>
            In severe cases, people may consider bankruptcy or another formal
            debt-relief process. Bankruptcy can have lasting consequences and
            does not necessarily eliminate every kind of debt or lien. It is a
            legal decision that requires advice specific to your circumstances.
          </p>
        </div>
        <div className="source-list">
          <p className="eyebrow">Authoritative reading</p>
          <ul>
            <li>
              <SourceLink href={cfpbLawsuit}>
                CFPB guidance on debt-collection lawsuits
              </SourceLink>
            </li>
            <li>
              <SourceLink href={cfpbGarnishment}>
                CFPB guidance on wage garnishment
              </SourceLink>
            </li>
            <li>
              <SourceLink href={ftcDebtCollection}>
                FTC debt-collection FAQs
              </SourceLink>
            </li>
            <li>
              <SourceLink href={usCourtsBankruptcy}>
                U.S. Courts bankruptcy discharge overview
              </SourceLink>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
