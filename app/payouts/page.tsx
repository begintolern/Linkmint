export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function PayoutPolicyPage() {
  const updated = new Date().toISOString().slice(0, 10);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Payout Policy</h1>
      <p className="text-sm text-gray-500">Last updated: {updated}</p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Overview</h2>
        <p>
          Linkmint pays users a share of confirmed commissions received from partner advertisers and
          affiliate networks. Pending amounts are estimates until confirmed and may be adjusted for
          reversals, cancellations, or compliance holds.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Schedule</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Payouts are processed on a regular cadence after funds clear from partners.</li>
          <li>Processing may be paused if fraud checks or compliance reviews are in progress.</li>
          <li>Auto‑payouts can be temporarily disabled for safety; manual payouts remain available.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Methods & Fees</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Primary payout method: PayPal (additional methods may be added later).</li>
          <li>Any payment provider fees are the responsibility of the recipient.</li>
          <li>Ensure your payout details (e.g., PayPal email) are accurate and up to date.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Thresholds</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Minimum payout threshold may apply based on program settings.</li>
          <li>Small balances may roll over to the next cycle until the threshold is met.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Reversals & Adjustments</h2>
        <p>
          Advertisers and networks may reverse transactions, apply holdbacks, or deny traffic for
          policy reasons. We reflect such adjustments in your balance and, if necessary, delay or
          deny payouts until investigations are complete.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Taxes</h2>
        <p>
          You are responsible for any applicable taxes on payouts you receive. We may collect
          tax information (e.g., W‑9/W‑8BEN) where required by law and may withhold payment until
          such information is provided.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Support</h2>
        <p>
          For payout issues or questions, contact{" "}
          <a className="text-blue-600 underline" href="mailto:support@linkmint.co">
            support@linkmint.co
          </a>.
        </p>
      </section>
    </main>
  );
}
