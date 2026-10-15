import Link from 'next/link';

const cfpb = 'https://www.consumerfinance.gov';
const ftc = 'https://consumer.ftc.gov';
const experian = 'https://www.experian.com';

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

export default function LearnPage() {
  return (
    <main className="page-shell learn-page">
      <header className="page-intro learn-intro">
        <p className="eyebrow">Before you apply</p>
        <h1>Credit card basics</h1>
        <p>
          A plain-English guide to common credit-card tradeoffs, terms, and
          questions. Compare offers carefully and read each card&apos;s terms
          before applying.
        </p>
      </header>

      <section aria-labelledby="tradeoffs-heading" className="learn-section">
        <div className="section-heading">
          <p className="eyebrow">At a glance</p>
          <h2 id="tradeoffs-heading">Pros and cons of credit cards</h2>
        </div>
        <div className="table-scroll">
          <table
            aria-label="Credit card pros and cons"
            className="tradeoffs-table"
          >
            <thead>
              <tr>
                <th scope="col">Potential benefits</th>
                <th scope="col">Things to watch for</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  Paying on time and keeping balances manageable can help build
                  a positive credit history.{' '}
                  <SourceLink
                    href={`${experian}/blogs/ask-experian/how-credit-cards-can-affect-your-credit-score/`}
                  >
                    Experian explains how cards can affect credit
                  </SourceLink>
                  .
                </td>
                <td>
                  Unpaid balances may accrue interest, sometimes calculated
                  daily.{' '}
                  <SourceLink
                    href={`${cfpb}/ask-cfpb/how-does-my-credit-card-company-calculate-the-amount-of-interest-i-owe-en-51/`}
                  >
                    The Consumer Financial Protection Bureau explains interest
                    calculations
                  </SourceLink>
                  .
                </td>
              </tr>
              <tr>
                <td>
                  Cards can be useful for purchases and may include rewards or
                  protections, depending on the issuer and card terms.
                </td>
                <td>
                  Fees, reward rules, and interest rates vary by card. Review
                  the issuer&apos;s disclosures before applying.
                </td>
              </tr>
              <tr>
                <td>
                  A secured card may be an option for building or rebuilding
                  credit when it reports to the major credit bureaus.{' '}
                  <SourceLink
                    href={`${experian}/blogs/ask-experian/what-is-a-secured-credit-card/`}
                  >
                    Learn about secured cards from Experian
                  </SourceLink>
                  .
                </td>
                <td>
                  Missing a payment can lead to fees and can harm your credit
                  history.{' '}
                  <SourceLink
                    href={`${cfpb}/ask-cfpb/when-is-my-credit-card-payment-considered-to-be-late-en-79/`}
                  >
                    CFPB explains late fees
                  </SourceLink>
                  .
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="terms-heading" className="learn-section">
        <div className="section-heading">
          <p className="eyebrow">Know the language</p>
          <h2 id="terms-heading">Common credit card terms</h2>
        </div>
        <dl className="terms-list">
          <div>
            <dt>APR</dt>
            <dd>
              Annual percentage rate: the yearly cost of borrowing expressed as
              a percentage. Different transaction types can have different APRs.{' '}
              <SourceLink
                href={`${cfpb}/ask-cfpb/how-does-my-credit-card-company-calculate-the-amount-of-interest-i-owe-en-51/`}
              >
                CFPB source
              </SourceLink>
            </dd>
          </div>
          <div>
            <dt>Credit limit</dt>
            <dd>
              The maximum amount the issuer allows you to borrow on the card.{' '}
              <SourceLink
                href={`${experian}/blogs/ask-experian/what-is-a-secured-credit-card/`}
              >
                Experian source
              </SourceLink>
            </dd>
          </div>
          <div>
            <dt>Billing cycle</dt>
            <dd>
              The period your statement covers; it ends on the statement closing
              date.{' '}
              <SourceLink
                href={`${experian}/blogs/ask-experian/how-to-read-credit-card-statement/`}
              >
                Experian source
              </SourceLink>
            </dd>
          </div>
          <div>
            <dt>Statement balance</dt>
            <dd>
              The amount shown when the billing cycle closes, which can differ
              from your current balance.{' '}
              <SourceLink
                href={`${experian}/blogs/ask-experian/what-is-a-credit-card-balance/`}
              >
                Experian source
              </SourceLink>
            </dd>
          </div>
          <div>
            <dt>Minimum payment</dt>
            <dd>
              The least amount required by the due date to keep the account
              current; paying only that amount can leave a balance that accrues
              interest.{' '}
              <SourceLink
                href={`${cfpb}/ask-cfpb/how-does-my-credit-card-company-calculate-the-amount-of-interest-i-owe-en-51/`}
              >
                CFPB source
              </SourceLink>
            </dd>
          </div>
          <div>
            <dt>Grace period</dt>
            <dd>
              The time between the end of a billing cycle and the payment due
              date. A card may let you avoid purchase interest by paying in full
              by the due date, but not every card offers one.{' '}
              <SourceLink
                href={`${cfpb}/ask-cfpb/what-is-a-grace-period-for-a-credit-card-en-47/`}
              >
                CFPB source
              </SourceLink>
            </dd>
          </div>
          <div>
            <dt>Credit utilization</dt>
            <dd>
              The share of your available revolving credit that you&apos;re
              using.{' '}
              <SourceLink
                href={`${experian}/blogs/ask-experian/how-important-is-credit-card-utilization/`}
              >
                Experian source
              </SourceLink>
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="questions-heading" className="learn-section">
        <div className="section-heading">
          <p className="eyebrow">FAQ</p>
          <h2 id="questions-heading">Common credit card questions</h2>
        </div>
        <div className="faq-list">
          <details>
            <summary>
              What is the difference between a credit card and a debit card?
            </summary>
            <p>
              A credit card lets you borrow up to a limit and repay the issuer
              later. A debit-card purchase generally draws money from your bank
              account.{' '}
              <SourceLink
                href={`${ftc}/articles/comparing-credit-charge-secured-credit-debit-or-prepaid-cards`}
              >
                Read the FTC&apos;s comparison
              </SourceLink>
              .
            </p>
          </details>
          <details>
            <summary>Do I need to carry a balance to build credit?</summary>
            <p>
              No. Making at least the required payment on time matters, but
              carrying a balance can lead to interest charges.{' '}
              <SourceLink
                href={`${experian}/blogs/ask-experian/how-credit-cards-can-affect-your-credit-score/`}
              >
                Experian explains this common misconception
              </SourceLink>
              .
            </p>
          </details>
          <details>
            <summary>How can I avoid interest on purchases?</summary>
            <p>
              If your card offers a purchase grace period and you are not
              already carrying a balance, paying the balance in full by the due
              date can avoid purchase interest.{' '}
              <SourceLink
                href={`${cfpb}/ask-cfpb/what-is-a-grace-period-for-a-credit-card-en-47/`}
              >
                See the CFPB&apos;s grace-period guidance
              </SourceLink>
              .
            </p>
          </details>
          <details>
            <summary>What should I compare before applying?</summary>
            <p>
              Look at the APRs, fees, rewards rules, credit limit, and any
              promotional terms. Your issuer&apos;s account-opening disclosures
              are the source of truth for a specific offer.{' '}
              <SourceLink
                href={`${cfpb}/data-research/credit-card-data/know-you-owe-credit-cards/`}
              >
                Review CFPB guidance on credit-card terms
              </SourceLink>
              .
            </p>
          </details>
          <details>
            <summary>What is a secured credit card?</summary>
            <p>
              A secured card requires a security deposit, which typically
              becomes your credit limit. It can be easier to qualify for than an
              unsecured card, but you still need to make payments on time.{' '}
              <SourceLink
                href={`${experian}/blogs/ask-experian/what-is-a-secured-credit-card/`}
              >
                Read Experian&apos;s secured-card overview
              </SourceLink>
              .
            </p>
          </details>
        </div>
      </section>

      <aside className="education-note">
        <h2>Use this as a starting point</h2>
        <p>
          This page provides educational information, not financial advice.
          Consider your budget and read the issuer&apos;s current terms before
          choosing or applying for a card.
        </p>
        <Link href="/results">Return to card matches</Link>
      </aside>
    </main>
  );
}
