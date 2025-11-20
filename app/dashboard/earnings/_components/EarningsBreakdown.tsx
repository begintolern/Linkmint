"use client";

export default function EarningsBreakdown({
  pending = 0,
  approved = 0,
  paid = 0,
}: {
  pending: number;
  approved: number;
  paid: number;
}) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      {/* Pending */}
      <div className="rounded-xl border border-yellow-300/40 bg-yellow-50 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700">
          Pending Earnings
        </p>
        <p className="mt-1 text-2xl font-bold text-yellow-800">
          ${pending.toFixed(2)}
        </p>
        <p className="mt-1 text-xs text-yellow-700/80">
          Waiting for merchant confirmation before moving to Approved.
        </p>
      </div>

      {/* Approved */}
      <div className="rounded-xl border border-green-300/40 bg-green-50 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
          Approved (Eligible for Payout)
        </p>
        <p className="mt-1 text-2xl font-bold text-green-800">
          ${approved.toFixed(2)}
        </p>
        <p className="mt-1 text-xs text-green-700/80">
          Merchant already paid Linkmint. You can request payout.
        </p>
      </div>

      {/* Paid */}
      <div className="rounded-xl border border-slate-300/40 bg-slate-50 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
          Paid Out
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-800">
          ${paid.toFixed(2)}
        </p>
        <p className="mt-1 text-xs text-slate-600/70">
          Already sent to your PayPal account.
        </p>
      </div>
    </div>
  );
}
