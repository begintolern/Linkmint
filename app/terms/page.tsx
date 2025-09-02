// app/terms/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service • Linkmint",
  description:
    "Linkmint Terms of Service: eligibility, accounts, commissions, payouts, referrals, prohibited use, liability, and termination.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Terms of Service</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: September 1, 2025</p>

      <section className="prose prose-slate mt-8">
        <h2>1. Eligibility</h2>
        <p>
          You must be <strong>18 years or older</strong> to use Linkmint. Accounts
          created by minors will be closed and any unpaid balances forfeited.
        </p>

        <h2>2. Accounts</h2>
        <ul>
          <li>You agree to provide accurate information and keep it up to date.</li>
          <li>Only one account per person. No shared or duplicate accounts.</li>
          <li>
            We may suspend or terminate accounts suspected of fraud, abuse, or
            misrepresentation.
          </li>
        </ul>

        <h2>3. Earnings &amp; Payouts</h2>
        <ul>
          <li>
            Commissions are earned when approved affiliate conversions are tracked to
            your links and paid to Linkmint by the respective affiliate network.
          </li>
          <li>
            <strong>Payouts are only made after affiliate networks pay Linkmint.</strong>{" "}
            Pending or unapproved commissions are not eligible.
          </li>
          <li>
            Standard split: <strong>80% user / 5% referrer / 15% Linkmint margin</strong>.
          </li>
          <li>
            Payouts are via PayPal only. PayPal fees are deducted from your payout.
          </li>
          <li>Minimum payout thresholds may apply and can change over time.</li>
        </ul>

        <h2>4. Referral Program</h2>
        <ul>
          <li>
            Inviting 3+ friends unlocks a <strong>90-day 5% override bonus</strong>.
          </li>
          <li>Self-referrals, fake accounts, and spam are prohibited and void bonuses.</li>
        </ul>

        <h2>5. Prohibited Use</h2>
        <ul>
          <li>No spam, bots, fake traffic, or prohibited placements per network rules.</li>
          <li>No misleading claims or attempts to game tracking or payouts.</li>
        </ul>

        <h2>6. Liability</h2>
        <ul>
          <li>
            Linkmint is not liable for missed earnings due to tracking issues, network
            decisions, or delays beyond our control.
          </li>
          <li>The service is provided “as-is” without warranties.</li>
        </ul>

        <h2>7. Termination</h2>
        <ul>
          <li>
            We may suspend or terminate any account that violates these Terms or applicable
            network policies.
          </li>
          <li>
            Balances linked to fraudulent activity will not be paid and may be reversed.
          </li>
        </ul>

        <h2>8. Changes</h2>
        <p>
          We may update these Terms from time to time. We will post changes on this page
          and update the “Last updated” date above. Continued use constitutes acceptance.
        </p>

        <h2>9. Contact</h2>
        <p>
          Questions? Email <a href="mailto:admin@linkmint.co">admin@linkmint.co</a>.
        </p>
      </section>
    </main>
  );
}
