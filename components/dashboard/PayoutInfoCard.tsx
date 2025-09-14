// components/dashboard/PayoutInfoCard.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";

type Props = {
  approvedTotal: number;
  threshold?: number;
  currency?: string;
  nextPayoutEtaText?: string;
};

export default function PayoutInfoCard({
  approvedTotal,
  threshold = 5,
  currency = "USD",
  nextPayoutEtaText = "Typically 30–60 days",
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fmt = (v: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(v);

  const canRequest = approvedTotal >= threshold && !submitting;

  const handleClick = async () => {
    if (!canRequest) return;
    setSubmitting(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/payouts/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "dashboard_overview" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Request failed");

      setMsg(
        data?.message ||
          "Payout request submitted! You’ll see it in your payout history shortly."
      );
    } catch (e: any) {
      setErr(
        e?.message ||
          "Something went wrong submitting your payout request. Please try again."
      );
    } finally {
      setSubmitting(false);
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
            {msg && <p className="mt-2 text-xs text-green-600">{msg}</p>}
            {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
          </div>

          <button
            disabled={!canRequest}
            onClick={handleClick}
            className={`mt-4 inline-flex items-center justify-center rounded-md px-4 py-2 text-white transition ${
              canRequest ? "bg-gray-900 hover:bg-black" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {submitting ? "Submitting..." : canRequest ? "Request payout" : "Threshold not met"}
          </button>

          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <Link className="underline" href="/dashboard/payouts">
              View payout history
            </Link>
            <Link className="underline" href="/trust">
              Trust Center
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
