// components/dashboard/PayoutInfoCard.tsx
import React from "react";
import Link from "next/link";

type Props = {
  approvedTotal: number;      // total approved amount
  threshold?: number;         // default 5
  currency?: string;          // default USD
  nextPayoutEtaText?: string; // e.g. "Typically 30–60 days"
  onRequestPayout?: () => void; // optional handler to wire later
};

export default function PayoutInfoCard({
  approvedTotal,
  threshold = 5,
  currency = "USD",
  nextPayoutEtaText = "Typically 30–60 days",
  onRequestPayout,
}: Props) {
  const fmt = (v: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(v);

  const canRequest = approvedTotal >= threshold;

  const handleClick = () => {
    if (!canRequest) return;
    if (onRequestPayout) {
      onRequestPayout();
    } else {
      // Placeholder until wired to a real API
      alert("Payout request submitted (placeholder).");
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
      <h2 className="text-lg font-semibold">Payouts</h2>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Approved balance</div>
          <div className="mt-1 text-2xl font-bold">{fmt(approvedTotal)}</div>
          <p className="mt-1 text-xs text-gray-500">
            Payouts are only made after Linkmint receives funds from the merchant.{" "}
            {nextPayoutEtaText}.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            PayPal transaction fees are automatically deducted from your payout.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Minimum payout threshold: <strong>{fmt(threshold)}</strong>.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 p-4 flex flex-col justify-between">
          <div>
            <div className="text-sm text-gray-600">Request payout</div>
            <p className="mt-1 text-sm text-gray-700">
              You can request a payout once your Approved earnings reach the threshold.
            </p>
          </div>

          <button
            disabled={!canRequest}
            onClick={handleClick}
            className={`mt-4 inline-flex items-center justify-center rounded-md px-4 py-2 text-white transition ${
              canRequest ? "bg-gray-900 hover:bg-black" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {canRequest ? "Request payout" : "Threshold not met"}
          </button>

          <p className="mt-2 text-xs text-gray-500">
            Questions? See our{" "}
            <Link className="underline" href="/trust">
              Trust Center
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
