export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-gray-500">Last updated: {new Date().toISOString().slice(0,10)}</p>

      <p>
        This Privacy Policy explains how <strong>Linkmint</strong> (“we”, “us”, “our”)
        collects, uses, and protects information when you use our website and services.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Information We Collect</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Account info:</strong> name, email, referral data you provide.</li>
          <li><strong>Usage data:</strong> pages viewed, clicks, timestamps, device/browser.</li>
          <li><strong>Payout data:</strong> payment email/identifier you submit to receive funds.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">How We Use Information</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Operate and improve our services, referrals, and payout features.</li>
          <li>Prevent abuse and enforce our Terms of Service.</li>
          <li>Comply with legal, tax, and accounting obligations.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Cookies & Tracking</h2>
        <p>
          We use cookies and similar technologies for session management, analytics, and referral
          attribution. You can control cookies via your browser settings. Disabling cookies may
          limit some features.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Sharing of Information</h2>
        <p>
          We do not sell personal information. We share data with service providers (e.g., hosting,
          payments) as needed to operate the service, and when required by law.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Data Retention</h2>
        <p>
          We retain information for as long as necessary to provide the service and meet legal
          obligations. You may request deletion subject to lawful exceptions.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Security</h2>
        <p>
          We implement reasonable safeguards to protect information. No system is 100% secure, and
          we cannot guarantee absolute security.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Your Choices</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Update your account information in your dashboard.</li>
          <li>Contact us to request access, correction, or deletion where applicable.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Children’s Privacy</h2>
        <p>
          Our services are not directed to children under 13. If you believe a child provided
          personal information, please contact us and we will take appropriate steps to remove it.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Contact Us</h2>
        <p>
          Email: <a className="text-blue-600 underline" href="mailto:support@linkmint.co">support@linkmint.co</a>
          <br />
          Address: Linkmint, [Your Business Address]
        </p>
      </section>
    </main>
  );
}
