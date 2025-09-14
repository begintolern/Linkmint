// components/dashboard/PayoutInfoCard.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  approvedTotal: number;
  threshold?: number;         // default 5
  currency?: string;          // default USD
  nextPayoutEtaText?: string; // e.g. "Typically 30–60 days"
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
  const [justSubmitted, setJustSubmitted] = useState(false); // for green success state

  const fmt = (v: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(v);

  const approved = approvedTotal || 0;
  const meetsThreshold = approved >= threshold;
  const canRequest = meetsThreshold && !submitting;

  // Reset the green success state after a short delay
  useEffect(() => {
    if (justSubmitted) {
      const t = setTimeout(() => setJustSubmitted(false), 2000);
      return () => clearTimeout(t);
    }
  }, [justSubmitted]);

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
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data?.message || "Request failed");

      setMsg(
        data?.message ||
          "Payout request submitted! You’ll see it in your payout history shortly."
      );
      setJustSubmitted(true);
    } catch (e: any) {
      setErr(
        e?.message ||
          "Something went wrong submitting your payout request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const buttonLabel = submitting
    ? "Submitting…"
    : justSubmitted
    ? "Request submitted!"
    : meetsThreshold
    ? "Request payout"
    : `Need at least ${fmt(threshold)}`;

  const buttonBase =
    "mt-4 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-white transition";
  const buttonStateClass = submitting
    ? "bg-gray-400 cursor-wait"
    : justSubmitted
    ? "bg-green-600 hover:bg-green-700"
    : meetsThreshold
    ? "bg-gray-900 hover:bg-black"
    : "bg-gray-300 cursor-not-allowed";

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
      <h2 className="text-lg font-semibold">Payouts</h2>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Approved balance</div>
          <div className="mt-1 text-2xl font-bold">{fmt(approved)}</div>
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
          {approved === 0 && (
            <p className="mt-2 text-xs text-gray-500">
              Once your Approved balance grows past the threshold, you’ll be able to request a payout here.
            </p>
          )}
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
            disabled={!meetsThreshold || submitting}
            onClick={handleClick}
            className={`${buttonBase} ${buttonStateClass}`}
          >
            {submitting && (
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
            <span>{buttonLabel}</span>
          </button>

          <p className="mt-3 text-xs text-gray-500">
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
