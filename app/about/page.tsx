export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function AboutPage() {
  const updated = new Date().toISOString().slice(0, 10);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">About Linkmint</h1>
      <p className="text-sm text-gray-500">Last updated: {updated}</p>

      <p>
        Linkmint helps creators and communities share curated offers and earn fairly from the value
        they create. We handle tracking, compliance, and payouts so you can focus on growth.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">What We Do</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Simple referral links with SubID tracking</li>
          <li>Transparent earnings with invitee & override bonuses</li>
          <li>Automated payout workflows and audit logs</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">How It Works</h2>
        <ol className="list-decimal pl-6 space-y-1">
          <li>Share your unique link.</li>
          <li>Qualifying purchases are tracked via partner networks.</li>
          <li>Earnings appear in your dashboard and are paid out on schedule.</li>
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Why Partners Choose Us</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Clear attribution and fraud‑aware controls</li>
          <li>Opt‑in override bonuses that reward referrals</li>
          <li>PayPal-supported payout pipeline (sandbox verified)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Contact</h2>
        <p>
          Questions? <a className="text-blue-600 underline" href="/contact">Contact us</a> or email{" "}
          <a className="text-blue-600 underline" href="mailto:support@linkmint.co">support@linkmint.co</a>.
        </p>
      </section>
    </main>
  );
}
