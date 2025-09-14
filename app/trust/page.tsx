// app/trust/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trust Center • Linkmint",
  description:
    "The Linkmint Trust Center: payout rules, platform margin, anti-fraud, and transparency to prove we're legit.",
};

export default function TrustPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Trust Center</h1>
      <p className="mt-2 text-sm text-slate-500">Transparency you can count on</p>

      <section className="prose prose-slate mt-8">
        <h2>How Payouts Work</h2>
        <ul>
          <li>
            <strong>No early payouts until we receive funds</strong> from affiliate
            networks. Even with high TrustScores, commissions are only eligible once the
            network pays Linkmint.
          </li>
          <li>
            Once approved and received, payouts move automatically from{" "}
            <em>Approved → Paid</em>.
          </li>
          <li>Payouts are via PayPal only. PayPal transaction fees are deducted.</li>
        </ul>

        <h2>Our Margin</h2>
        <p>
          We keep a <strong>15% minimum platform margin</strong>. This covers:
        </p>
        <ul>
          <li>PayPal fees (~3%).</li>
          <li>Infrastructure and security costs.</li>
          <li>Fraud protection and reserves.</li>
          <li>Profit to sustain and grow the platform.</li>
        </ul>
        <p>
          The rest (<strong>85%</strong>) goes back to our community — 80% to the earner,
          5% to the inviter (for 90 days).
        </p>

        <h2>Anti-Fraud &amp; Fairness</h2>
        <ul>
          <li>We block spam, fake traffic, and duplicate accounts.</li>
          <li>We follow affiliate networks’ placement rules strictly.</li>
          <li>Fraudulent activity voids earnings and referrals.</li>
        </ul>

        <h2>Transparency Promise</h2>
        <p>
          Every payout, commission, and referral event is logged in your dashboard and in
          our admin system. You’ll always know where your money stands.
        </p>

        <h2>Contact</h2>
        <p>
          Questions or concerns? Email{" "}
          <a href="mailto:admin@linkmint.co">admin@linkmint.co</a>.
        </p>
      </section>
    </main>
  );
}
