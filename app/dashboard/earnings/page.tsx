// app/dashboard/earnings/page.tsx
"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import DashboardPageHeader from "@/components/DashboardPageHeader";

type Commission = {
  id: string;
  createdAt: string;
  merchantName?: string | null;
  status?: string;        // UNVERIFIED | PENDING | APPROVED | PAID
  amount?: number | null; // dollars
  amountCents?: number | null; // optional: some APIs return cents
  description?: string | null;
};

type ApiResponse =
  | { ok: true; commissions: Commission[] }
  | { ok: false; error?: string };

export default function EarningsPage() {
  const [rows, setRows] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Try canonical endpoint first; fall back to a legacy one if needed
        let res = await fetch("/api/commissions/list", { cache: "no-store" });
        if (!res.ok) {
          // fallback: some repos use /api/earnings/list
          const alt = await fetch("/api/earnings/list", { cache: "no-store" });
          res = alt;
        }
        const json: ApiResponse = await res.json();
        if (!("ok" in json) || !json.ok) {
          throw new Error((json as any)?.error || "Failed to load commissions.");
        }
        setRows(json.commissions ?? []);
      } catch (e: any) {
        setErr(e?.message || "Failed to load commissions.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totals = useMemo(() => {
    const toUsd = (r: Commission) =>
      typeof r.amountCents === "number"
        ? r.amountCents / 100
        : typeof r.amount === "number"
        ? r.amount
        : 0;

    const sum = (flt?: (r: Commission) => boolean) =>
      rows.filter(flt || (() => true)).reduce((a, r) => a + toUsd(r), 0);

    return {
      all: sum(),
      approved: sum((r) => (r.status || "").toUpperCase() === "APPROVED"),
      pending: sum((r) => (r.status || "").toUpperCase() === "PENDING"),
      paid: sum((r) => (r.status || "").toUpperCase() === "PAID"),
    };
  }, [rows]);

  return (
    <main className="space-y-6">
      <DashboardPageHeader
        title="Earnings"
        subtitle="Commissions across merchants and statuses."
        rightSlot={
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <Badge label="Total" value={totals.all} />
            <Badge label="Pending" value={totals.pending} />
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

      {/* Alert */}
      {err && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-800 p-3 text-sm">
          {err} — showing empty results.
        </div>
      )}

      {/* Table */}
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
                <th className="p-3 sm:p-3">Date</th>
                <th className="p-3 sm:p-3">Amount</th>
                <th className="p-3 sm:p-3 hidden sm:table-cell">Merchant</th>
                <th className="p-3 sm:p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-6 text-gray-500" colSpan={4}>
                    Loading…
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((r) => {
                  const d = new Date(r.createdAt).toLocaleString();
                  const amt =
                    typeof r.amountCents === "number"
                      ? (r.amountCents / 100).toFixed(r.amountCents % 100 === 0 ? 0 : 2)
                      : typeof r.amount === "number"
                      ? r.amount.toFixed(Number.isInteger(r.amount) ? 0 : 2)
                      : "0.00";
                  const status = (r.status || "UNVERIFIED").toUpperCase();

                  return (
                    <tr key={r.id} className="border-t align-middle">
                      <td className="p-3">
                        <div className="whitespace-nowrap">{d}</div>
                        {/* Mobile-only: show merchant below date */}
                        <div className="mt-0.5 text-xs text-gray-500 sm:hidden">
                          {r.merchantName ?? "—"}
                        </div>
                      </td>
                      <td className="p-3 font-medium">${amt}</td>
                      <td className="p-3 hidden sm:table-cell">{r.merchantName ?? "—"}</td>
                      <td className="p-3">
                        <StatusBadge status={status as any} />
                      </td>
                    </tr>
                  );
                })
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
