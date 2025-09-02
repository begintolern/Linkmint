// app/privacy/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy • Linkmint",
  description:
    "Linkmint Privacy Policy: what we collect, how we use it, who we share it with, cookies, retention, security, and contact.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: September 1, 2025</p>

      <section className="prose prose-slate mt-8">
        <h2>1. Information We Collect</h2>
        <ul>
          <li>Account info: email, name, password (stored as a hash).</li>
          <li>Referral &amp; commission activity, payout account email.</li>
          <li>Usage data (e.g., device/browser metadata) for security and analytics.</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>Operate Linkmint: track referrals, calculate commissions, process payouts.</li>
          <li>Send transactional messages (verification, payout notices, security alerts).</li>
          <li>Prevent fraud and enforce our Terms and affiliate network rules.</li>
        </ul>

        <h2>3. Sharing of Data</h2>
        <ul>
          <li>
            Affiliate networks (to attribute conversions and receive program payments).
          </li>
          <li>PayPal (to process payouts).</li>
          <li>
            Service providers (email, logging) under contract; we don’t sell personal data.
          </li>
        </ul>

        <h2>4. Cookies &amp; Tracking</h2>
        <ul>
          <li>Session cookies for authentication and keeping you signed in.</li>
          <li>
            Referral tracking cookies/pixels (including those from affiliate networks) to
            attribute conversions.
          </li>
        </ul>

        <h2>5. Data Retention &amp; Deletion</h2>
        <ul>
          <li>
            We retain account and transaction records as required by law and for audit.
          </li>
          <li>
            You may request account deletion via{" "}
            <a href="mailto:admin@linkmint.co">admin@linkmint.co</a>. Some records may be
            retained where legally necessary (e.g., financial logs).
          </li>
        </ul>

        <h2>6. Security</h2>
        <ul>
          <li>Passwords are hashed; sensitive data is stored securely.</li>
          <li>
            We employ access controls and monitoring to protect against unauthorized access.
          </li>
        </ul>

        <h2>7. Children</h2>
        <p>
          Linkmint is for adults 18+ only. We do not knowingly collect information from
          children under 18.
        </p>

        <h2>8. Changes</h2>
        <p>
          We may update this Privacy Policy. Changes will be posted here with an updated
          “Last updated” date.
        </p>

        <h2>9. Contact</h2>
        <p>
          Email <a href="mailto:admin@linkmint.co">admin@linkmint.co</a>.
        </p>
      </section>
    </main>
  );
}
