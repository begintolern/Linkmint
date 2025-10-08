// app/dashboard/earnings/page.tsx
"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useState } from "react";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import StatusBadge from "@/components/StatusBadge";

// Shape returned by /api/user/commissions/summary
type SummaryOk = {
  pending: number;
  approved: number;
  processing: number;
  paid: number;
  failed: number;
  bonus: {
    cents: number;
    usd: number;
    tier: number;
    eligibleUntil: string | null;
    remainingDays: number | null;
    active: boolean;
  };
};
type SummaryResp = SummaryOk | { error: string };

export default function EarningsPage() {
  const [summary, setSummary] = useState<SummaryOk | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/commissions/summary", { cache: "no-store" });
        const json: SummaryResp = await res.json();

        if ("error" in json) throw new Error(json.error || "Failed to load.");
        setSummary(json);
      } catch (e: any) {
        setErr(e?.message || "Failed to load earnings summary.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totals = useMemo(() => {
    if (!summary) return { all: 0, pending: 0, approved: 0, paid: 0 };
    const all = summary.pending + summary.approved + summary.processing + summary.paid;
    return {
      all,
      pending: summary.pending,
      approved: summary.approved,
      paid: summary.paid,
    };
  }, [summary]);

  return (
    <main className="space-y-6">
      <DashboardPageHeader
        title="Earnings"
        subtitle="Commissions across merchants and statuses."
        rightSlot={
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <Badge label="Total" value={totals.all} />
            <Badge block label="Pending approval" value={totals.pending} />
            <Badge label="Approved" value={totals.approved} />
            <Badge label="Paid" value={totals.paid} />
          </div>
        }
      />

      {/* Mobile totals */}
      <div className="sm:hidden grid grid-cols-2 gap-2">
        <Badge block label="Total" value={totals.all} />
        <Badge block label="Pending" value={totals.pending} />
        <Badge block label="Approved" value={totals.approved} />
        <Badge block label="Paid" value={totals.paid} />
      </div>

      {/* Alert (only if the summary call failed) */}
      {err && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-800 p-3 text-sm">
          {err} — showing empty results.
        </div>
      )}

      {/* Recent commissions table (placeholder until list endpoint is added) */}
      <section className="rounded-xl border bg-white">
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4">
          <h2 className="text-sm sm:text-base font-medium">Recent Commissions</h2>
          <span className="hidden sm:inline-flex items-center rounded-full border px-3 py-1 text-xs text-gray-700">
            Total: ${totals.all.toFixed(2)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-left z-10">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Amount</th>
                <th className="p-3 hidden sm:table-cell">Merchant</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-6 text-gray-500" colSpan={4}>
                    Loading…
                  </td>
                </tr>
              ) : (
                <tr>
                  <td className="p-6 text-gray-500" colSpan={4}>
                    No commissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Badge({ label, value, block = false }: { label: string; value: number; block?: boolean }) {
  return (
    <span
      className={`inline-flex ${block ? "w-full justify-between" : "items-center"} rounded-xl border px-3 py-1.5 text-xs sm:text-sm text-gray-800 bg-white`}
    >
      <span className="font-medium">{label}</span>
      <span className="ml-2 tabular-nums">${value.toFixed(2)}</span>
    </span>
  );
}
