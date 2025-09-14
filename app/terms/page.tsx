import React from "react";
import Link from "next/link";

// Optional: centralize these so you can update dates in one spot.
const EFFECTIVE_DATE = "September 13, 2025";
const LAST_UPDATED = "September 13, 2025";

export const metadata = {
  title: "Terms of Service | linkmint.co",
  description:
    "The binding user agreement for linkmint.co. Read our Terms of Service covering eligibility, payouts, fraud, TrustScore, liability, and more.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen px-4 py-10 md:py-16">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="mt-2 text-sm text-gray-600">
            <span className="mr-3">Effective:</span>
            <time dateTime="2025-09-13">{EFFECTIVE_DATE}</time>
            <span className="mx-3">•</span>
            <span>
              Last Updated: <time dateTime="2025-09-13">{LAST_UPDATED}</time>
            </span>
          </p>
          <p className="mt-3 text-sm text-gray-600">
            Welcome to <strong>linkmint.co</strong> (“Linkmint,” “we,” “our,” or “us”). These
            Terms of Service (“Terms”) form a binding agreement between you (“User,” “you,” or
            “your”) and Linkmint. By creating an account, using our platform, or accessing our
            services, you agree to these Terms.
          </p>
        </header>

        {/* Quick Table of Contents */}
        <nav
          aria-label="Table of contents"
          className="mb-8 rounded-xl border bg-white p-4 shadow-sm"
        >
          <h2 className="mb-2 text-sm font-semibold text-gray-800">
            Table of Contents
          </h2>
          <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
            <li><a className="hover:underline" href="#eligibility">Eligibility</a></li>
            <li><a className="hover:underline" href="#nature">Nature of Service</a></li>
            <li><a className="hover:underline" href="#payouts">Commission & Payout Rules</a></li>
            <li><a className="hover:underline" href="#responsibilities">User Responsibilities</a></li>
            <li><a className="hover:underline" href="#trustscore">TrustScore & Referral Rules</a></li>
            <li><a className="hover:underline" href="#relationship">Independent Affiliate Relationship</a></li>
            <li><a className="hover:underline" href="#fraud">Fraud & Abuse</a></li>
            <li><a className="hover:underline" href="#termination">Termination</a></li>
            <li><a className="hover:underline" href="#liability">Limitation of Liability</a></li>
            <li><a className="hover:underline" href="#indemnification">Indemnification</a></li>
            <li><a className="hover:underline" href="#changes">Changes to Terms</a></li>
            <li><a className="hover:underline" href="#law">Governing Law & Dispute Resolution</a></li>
            <li><a className="hover:underline" href="#entire">Entire Agreement</a></li>
          </ol>
        </nav>

        <section id="eligibility" className="prose prose-gray max-w-none">
          <h2>1. Eligibility</h2>
          <ul>
            <li>You must be at least <strong>18 years old</strong> to use Linkmint.</li>
            <li>Each individual may only create <strong>one</strong> account.</li>
            <li>All information you provide must be truthful and accurate.</li>
          </ul>
        </section>

        <section id="nature" className="prose prose-gray max-w-none mt-8">
          <h2>2. Nature of Service</h2>
          <p>
            Linkmint is an <strong>affiliate link-sharing and rewards platform</strong>. You
            understand and agree that all commissions and payouts are contingent on third-party
            affiliate networks and merchants. Linkmint does not sell products directly and does not
            guarantee earnings.
          </p>
        </section>

        <section id="payouts" className="prose prose-gray max-w-none mt-8">
          <h2>3. Commission &amp; Payout Rules</h2>
          <ol>
            <li>
              <strong>Pending vs Approved:</strong> Commissions remain <em>pending</em> until the
              relevant merchant/affiliate network marks them <strong>approved</strong> and payment
              is received by Linkmint.
            </li>
            <li>
              <strong>No Guarantee:</strong> Commissions may be reversed, declined, or canceled by
              merchants or networks. Linkmint is not liable for these changes.
            </li>
            <li>
              <strong>Payment Method:</strong> Payouts are made via <strong>PayPal</strong> only.
              You must maintain an eligible PayPal account. Applicable fees are deducted.
            </li>
            <li>
              <strong>Fees:</strong> PayPal and other payment processing fees, as well as any
              applicable charges, are deducted from payouts.
            </li>
            <li>
              <strong>Timing:</strong> New users are subject to a minimum <strong>30-day waiting
              period</strong> (“honeymoon period”) before eligibility for payout unless modified by
              Linkmint. Payouts are only made after Linkmint receives cleared funds from affiliate
              networks. Early payouts or float advances may be offered at Linkmint’s discretion and
              are not guaranteed.
            </li>
            <li>
              <strong>Minimum Payout:</strong> Linkmint may establish minimum payout thresholds,
              which will be displayed in the user dashboard.
            </li>
          </ol>
        </section>

        <section id="responsibilities" className="prose prose-gray max-w-none mt-8">
          <h2>4. User Responsibilities</h2>
          <p>You agree to comply with:</p>
          <ul>
            <li>Affiliate network terms of service;</li>
            <li>Merchant-specific restrictions (as listed in our Merchant Rules Database); and</li>
            <li>All applicable laws and regulations.</li>
          </ul>
          <p>Prohibited actions include, without limitation:</p>
          <ul>
            <li>Fraudulent clicks, self-purchases solely to trigger commissions, or artificial traffic;</li>
            <li>Misrepresentation, spam, or deceptive advertising;</li>
            <li>Attempting to manipulate payouts, referrals, or TrustScore.</li>
          </ul>
        </section>

        <section id="trustscore" className="prose prose-gray max-w-none mt-8">
          <h2>5. TrustScore &amp; Referral Rules</h2>
          <p>
            Linkmint assigns each User a <strong>TrustScore</strong> which may affect payout
            eligibility, referral bonuses, and commission share tiers. Linkmint may adjust
            TrustScore criteria at any time to protect platform integrity. Abuse of the referral
            system may result in suspension and forfeiture of earnings.
          </p>
        </section>

        <section id="relationship" className="prose prose-gray max-w-none mt-8">
          <h2>6. Independent Affiliate Relationship</h2>
          <p>
            Nothing in these Terms creates an employer-employee, joint venture, agency, or
            partnership relationship. You act solely as an <strong>independent affiliate</strong>,
            responsible for your own taxes, record-keeping, and legal compliance.
          </p>
        </section>

        <section id="fraud" className="prose prose-gray max-w-none mt-8">
          <h2>7. Fraud &amp; Abuse</h2>
          <p>
            Linkmint may suspend or terminate accounts at its sole discretion if fraud, abuse, or
            suspicious activity is detected. Fraudulent or abusive Users forfeit all pending and
            unpaid earnings. Linkmint may share information with affiliate networks or authorities
            in cases of suspected fraud.
          </p>
        </section>

        <section id="termination" className="prose prose-gray max-w-none mt-8">
          <h2>8. Termination</h2>
          <ul>
            <li>
              Linkmint may suspend, limit, or terminate your account at any time, including for
              fraud, violation of these Terms, or violation of affiliate/merchant rules.
            </li>
            <li>
              You may terminate your account at any time. Any commissions not yet approved or
              received by Linkmint are forfeited upon termination.
            </li>
          </ul>
        </section>

        <section id="liability" className="prose prose-gray max-w-none mt-8">
          <h2>9. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Linkmint is not responsible for indirect,
            incidental, or consequential damages, including lost profits. Linkmint’s maximum
            liability to any User will not exceed the amount of the last payout actually made to
            that User.
          </p>
        </section>

        <section id="indemnification" className="prose prose-gray max-w-none mt-8">
          <h2>10. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Linkmint and its affiliates,
            officers, directors, and employees from any claims, damages, liabilities, and expenses
            arising out of your use of Linkmint, your violation of these Terms, or your violation
            of third-party rights or laws.
          </p>
        </section>

        <section id="changes" className="prose prose-gray max-w-none mt-8">
          <h2>11. Changes to Terms</h2>
          <p>
            Linkmint may update these Terms at any time. Continued use after changes constitutes
            acceptance. Material changes will be notified via the dashboard or email.
          </p>
        </section>

        <section id="law" className="prose prose-gray max-w-none mt-8">
          <h2>12. Governing Law &amp; Dispute Resolution</h2>
          <p>
            These Terms are governed by the laws of the <strong>State of California, USA</strong>.
            Any disputes will be resolved in the state or federal courts located in California.
            Linkmint may require certain disputes to go through binding arbitration.
          </p>
        </section>

        <section id="entire" className="prose prose-gray max-w-none mt-8">
          <h2>13. Entire Agreement</h2>
          <p>
            These Terms, together with our{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>{" "}
            and any official payout rules posted in the dashboard, form the entire agreement
            between you and Linkmint.
          </p>
        </section>

        <hr className="my-10" />

        <footer className="text-sm text-gray-600">
          <p className="mb-2">
            Questions about these Terms? Contact{" "}
            <a
              href="mailto:admin@linkmint.co"
              className="text-blue-600 hover:underline"
            >
              admin@linkmint.co
            </a>
            .
          </p>
          <p className="mb-6">
            By creating an account, you agree to these Terms of Service and our{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>

          <div className="rounded-xl border bg-white p-4 text-xs text-gray-600">
            <p className="font-medium">Operational Note</p>
            <p className="mt-1">
              For transparency: commissions are paid only after affiliate partners mark them{" "}
              <strong>Approved</strong> and funds are received by Linkmint. Payouts are made via
              PayPal; applicable fees are deducted.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
