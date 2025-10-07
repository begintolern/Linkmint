// app/dashboard/payouts/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { cookies } from "next/headers";
import RequestPayoutButton from "@/components/RequestPayoutButton";

export default async function PayoutsPage() {
  const store = cookies();
  const userId = store.get("userId")?.value ?? "";
  const email = store.get("email")?.value ?? "";
  const name = email ? email.split("@")[0] : "there";

  // No privileged API calls here — render-only page
  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
      <header className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold">Payouts</h1>
        <p className="text-sm text-gray-600">Hi {name}, manage your cashout options and requests here.</p>
      </header>

      <section className="rounded-2xl border p-4 sm:p-5 bg-white space-y-3">
        <h2 className="text-base sm:text-lg font-medium">Balance & Request</h2>
        <div className="text-sm text-gray-600">
          <p>Total earnings eligible for payout will appear here once commissions clear.</p>
          <p className="mt-1">PH payouts via <strong>GCash</strong> or <strong>PayPal</strong>. Minimum <strong>₱500</strong>. Fees may apply.</p>
        </div>
        <div className="pt-2">
          <RequestPayoutButton userId={userId} />
        </div>
      </section>

      <section className="rounded-2xl border p-4 sm:p-5 bg-white space-y-3">
        <h3 className="text-base font-medium">Provider status</h3>
        <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
          <li>
            <strong>GCash (PH)</strong>: <span className="text-amber-700">Provisioned</span> — live transfers disabled until
            business credentials are configured (<code>GCASH_CLIENT_ID</code>, <code>GCASH_SECRET</code>).
          </li>
          <li>
            <strong>PayPal</strong>: <span className="text-amber-700">Provisioned</span> — manual review for beta payouts.
          </li>
        </ul>
        <p className="text-xs text-gray-500">
          Note: This section is informational only and does not call protected admin APIs.
        </p>
      </section>
    </div>
  );
}
