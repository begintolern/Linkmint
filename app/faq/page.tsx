// app/faq/page.tsx
import React from "react";
import Link from "next/link";

export const metadata = {
  title: "FAQ | linkmint.co",
  description:
    "Frequently asked questions about Linkmint — payouts, commissions, tracking, and account basics.",
};

type SectionProps = {
  id: string;
  title: string;
  children: React.ReactNode;
};
function Section({ id, title, children }: SectionProps) {
  return (
    <section id={id} className="prose prose-gray max-w-none mt-8">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function FAQPage() {
  return (
    <main className="min-h-screen px-4 py-10 md:py-16">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h1>
          <p className="mt-3 text-sm text-gray-600">
            Quick answers about commissions, payouts, tracking, and your account. If you don’t see
            your question, message us at{" "}
            <a className="text-blue-600 hover:underline" href="mailto:admin@linkmint.co">
              admin@linkmint.co
            </a>
            .
          </p>
        </header>

        <nav
          aria-label="Table of contents"
          className="mb-8 rounded-xl border bg-white p-4 shadow-sm"
        >
          <h2 className="mb-2 text-sm font-semibold text-gray-800">Table of Contents</h2>
          <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
            <li>
              <a className="hover:underline" href="#payout-policy">
                Payout Policy
              </a>
            </li>
            <li>
              <a className="hover:underline" href="#tracking">
                Tracking & Approvals
              </a>
            </li>
            <li>
              <a className="hover:underline" href="#account">
                Account & Security
              </a>
            </li>
            <li>
              <a className="hover:underline" href="#legal">
                Legal & Compliance
              </a>
            </li>
          </ol>
        </nav>

        {/* Known section from your repo; we’re preserving key lines you already had */}
        <Section id="payout-policy" title="Payout Policy">
          <p>
            Payouts progress through stages: <strong>Pending → Approved → Paid</strong>.
          </p>
          <ul>
            <li>
              Payouts can be processed automatically (<em>admin toggle</em>) or via manual approval.
            </li>
            <li>Payouts are via PayPal only. PayPal transaction fees are deducted.</li>
            <li>
              New users may have a minimum waiting period before first payout; approvals depend on
              affiliate network confirmations and funds received by Linkmint.
            </li>
          </ul>

          {/* NEW concise tax entry */}
          <div className="mt-4">
            <h3 className="font-medium">Who handles taxes on my commission?</h3>
            <p className="text-sm text-gray-700 mt-1">
              You do. Linkmint may collect a W-9/W-8 and issue required forms (e.g., 1099-NEC). We
              may withhold or delay payouts if required by law or until valid tax info is on file.
            </p>
          </div>

          <div className="mt-4">
            <h3 className="font-medium">When do payouts happen?</h3>
            <p className="text-sm text-gray-700 mt-1">
              After a merchant/affiliate network approves the commission and funds are received by
              Linkmint. We don’t pay out pending or reversed commissions.
            </p>
          </div>

          <div className="mt-4">
            <h3 className="font-medium">Minimum payout?</h3>
            <p className="text-sm text-gray-700 mt-1">
              Minimum thresholds may apply and are shown on your{" "}
              <Link href="/dashboard/payouts" className="text-blue-600 hover:underline">
                Payouts
              </Link>{" "}
              page.
            </p>
          </div>
        </Section>

        <Section id="tracking" title="Tracking & Approvals">
          <ul>
            <li>
              Conversions are tracked via affiliate network links/cookies. Some merchants have
              stricter rules; see our{" "}
              <Link href="/dashboard/merchants" className="text-blue-600 hover:underline">
                Merchant Rules
              </Link>{" "}
              for details.
            </li>
            <li>
              Approvals are controlled by merchants/networks. If a merchant reverses a transaction,
              the commission is removed.
            </li>
            <li>
              If you think something didn’t track, email{" "}
              <a className="text-blue-600 hover:underline" href="mailto:admin@linkmint.co">
                admin@linkmint.co
              </a>{" "}
              with your link and timestamp.
            </li>
          </ul>
        </Section>

        <Section id="account" title="Account & Security">
          <ul>
            <li>
              Keep your account secure with a unique password. We may flag unusual activity to
              protect your balance.
            </li>
            <li>
              Don’t spam, mislead, or run prohibited promotions. Violations can result in suspension
              and forfeiture of pending earnings.
            </li>
            <li>
              If your PayPal address changes, update it in{" "}
              <Link href="/settings" className="text-blue-600 hover:underline">
                Settings
              </Link>{" "}
              before requesting payouts.
            </li>
          </ul>
        </Section>

        <Section id="legal" title="Legal & Compliance">
          <ul>
            <li>
              See our{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              .
            </li>
            <li>
              Taxes: you are responsible for your local tax obligations. Linkmint may collect
              W-9/W-8 and issue 1099-NEC where required.
            </li>
            <li>
              Some merchant programs restrict self-purchases, coupon use, or paid traffic. Always
              check rules before promoting.
            </li>
          </ul>
        </Section>
      </div>
    </main>
  );
}
