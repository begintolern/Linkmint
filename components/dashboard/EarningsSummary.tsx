// components/dashboard/EarningsSummary.tsx
import React from "react";

type Props = {
  pending: number;   // e.g. 12.34
  approved: number;  // e.g. 56.78
  paid: number;      // e.g. 90.12
  currency?: string; // default USD
};

export default function EarningsSummary({
  pending,
  approved,
  paid,
  currency = "USD",
}: Props) {
  const fmt = (v: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(v);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
      <h2 className="text-lg font-semibold">Earnings</h2>
      <p className="mt-1 text-sm text-gray-600">
        Track commissions as they move from <strong>Pending</strong> →{" "}
        <strong>Approved</strong> → <strong>Paid</strong>.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="mt-1 text-2xl font-bold">{fmt(pending)}</div>
          <p className="mt-1 text-xs text-gray-500">
            These commissions are waiting for approval from the merchant. They’ll move to
            <strong> Approved</strong> once cleared.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Approved</div>
          <div className="mt-1 text-2xl font-bold">{fmt(approved)}</div>
          <p className="mt-1 text-xs text-gray-500">
            These commissions are cleared by the merchant and will be eligible for payout.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Paid</div>
          <div className="mt-1 text-2xl font-bold">{fmt(paid)}</div>
          <p className="mt-1 text-xs text-gray-500">
            These commissions have been paid out to your PayPal account.
          </p>
        </div>
      </div>
    </section>
  );
}
