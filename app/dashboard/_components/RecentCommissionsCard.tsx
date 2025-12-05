"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CommissionItem = {
  id: string;
  amount: number;
  status: string;
  type: string | null;
  source: string | null;
  description: string | null;
  createdAt: string; // ISO
};

type ApiResponse =
  | { success: true; items: CommissionItem[] }
  | { success: false; error: string };

export default function RecentCommissionsCard() {
  const [data, setData] = useState<CommissionItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/user/commissions/recent", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        const json = (await res.json()) as ApiResponse;

        if (cancelled) return;

        if (!res.ok || !("success" in json) || !json.success) {
          setError(
            (json as any)?.error || "Could not load recent commissions."
          );
          setData(null);
        } else {
          setData(json.items);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load recent commissions.");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasData = !loading && !error && data && data.length > 0;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <header className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-50">
            Recent commissions
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Latest earnings from your affiliate activity.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            window.location.reload();
          }}
          className="rounded-full border border-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:border-teal-500 hover:text-teal-200"
        >
          Refresh
        </button>
      </header>

      {loading && (
        <p className="text-xs text-slate-400">Loading commissions…</p>
      )}

      {!loading && error && (
        <p className="text-xs text-rose-400">{error}</p>
      )}

      {!loading && !error && (!data || data.length === 0) && (
        <p className="text-xs text-slate-400">
          No commissions yet. Your first approved purchase will appear here.
        </p>
      )}

      {hasData && (
        <>
          <ul className="mt-2 space-y-2">
            {data!.slice(0, 6).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-slate-100">
                    ₱{item.amount.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.createdAt).toLocaleString("en-PH", {
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {item.source || "Affiliate commission"}
                  </span>
                  <span className="mt-0.5 text-[10px] text-slate-500">
                    {trustHint(item.status)}
                  </span>
                </div>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase " +
                    statusClass(item.status)
                  }
                >
                  {statusLabel(item.status)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex justify-end">
            <Link
              href="/dashboard/earnings"
              className="text-[10px] font-semibold text-teal-300 hover:text-teal-200 underline-offset-2 hover:underline"
            >
              View all earnings →
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

function statusLabel(status: string) {
  const s = status.toLowerCase();
  if (s === "approved") return "Approved";
  if (s === "paid") return "Paid";
  return "Pending";
}

function statusClass(status: string) {
  const s = status.toLowerCase();
  if (s === "approved")
    return "bg-emerald-500/15 text-emerald-200 border border-emerald-500/60";
  if (s === "paid")
    return "bg-sky-500/15 text-sky-200 border border-sky-500/60";
  return "bg-amber-500/15 text-amber-100 border border-amber-500/60";
}

function trustHint(status: string) {
  const s = status.toLowerCase();
  if (s === "approved") {
    return "Approved commissions slowly boost your TrustScore.";
  }
  if (s === "paid") {
    return "Paid payouts help unlock faster and smoother withdrawals.";
  }
  return "Pending while the merchant/affiliate approves this order.";
}
