// app/trust-center/page.tsx
import Link from "next/link";

export default function TrustCenterPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Trust Center</h1>
      <p className="text-gray-600">
        We designed Linkmint to be transparent and audit-friendly for creators,
        partners, and networks. Below is an overview of how we verify users,
        attribute conversions, prevent abuse, and handle payouts.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-4 border rounded-lg shadow-sm bg-white">
          <h2 className="font-semibold mb-2">Account verification</h2>
          <ul className="list-disc pl-5 text-gray-700 space-y-1">
            <li>Email verification is required for all accounts.</li>
            <li>Fraud checks on referral batches (3 verified invites start a 90-day window).</li>
            <li>Event logs retained for admin review.</li>
          </ul>
        </div>

        <div className="p-4 border rounded-lg shadow-sm bg-white">
          <h2 className="font-semibold mb-2">Attribution &amp; tracking</h2>
          <ul className="list-disc pl-5 text-gray-700 space-y-1">
            <li>Smart Links attach partner tracking where programs exist.</li>
            <li>We show status by stage: Pending → Approved → Paid.</li>
            <li>Override earnings: 5% on invitees’ approved commissions for 90 days.</li>
          </ul>
        </div>

        <div className="p-4 border rounded-lg shadow-sm bg-white">
          <h2 className="font-semibold mb-2">Anti‑abuse</h2>
          <ul className="list-disc pl-5 text-gray-700 space-y-1">
            <li>Automated flags for abnormal click/purchase patterns.</li>
            <li>Invite batching and windowed overrides limit abuse.</li>
            <li>Manual admin audit + reversible payouts when needed.</li>
          </ul>
        </div>

        <div className="p-4 border rounded-lg shadow-sm bg-white">
          <h2 className="font-semibold mb-2">Payouts</h2>
          <ul className="list-disc pl-5 text-gray-700 space-y-1">
            <li>Clear status history and running totals in dashboard.</li>
            <li>Auto‑payout can be toggled by admin; manual override supported.</li>
            <li>Reconciliation via logs; decimal‑safe calculations.</li>
          </ul>
        </div>
      </div>

      {/* Link to FAQ payout policy */}
      <div className="mt-8 p-4 bg-gray-50 border rounded-lg text-center">
        <p>
          For more details, see our{" "}
          <Link href="/faq#payout-policy" className="text-blue-600 underline">
            full payout policy in the FAQ
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
