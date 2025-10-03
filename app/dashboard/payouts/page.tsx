// app/dashboard/payouts/page.tsx
"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useState } from "react";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import PayoutInfoCard from "@/components/dashboard/PayoutInfoCard";
import StatusBadge from "@/components/StatusBadge";

type Payout = {
  id: string;
  createdAt: string;
  provider: "PAYPAL" | "PAYONEER";
  statusEnum: string;
  netCents: number;
  receiverEmail: string | null;
};

export default function DashboardPayoutsPage() {
  const [rows, setRows] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/payouts/list", { cache: "no-store" });
        const json = await res.json();
        setRows(json?.payouts ?? []);
      } catch (e: any) {
        setErr(e?.message || "Failed to load payouts.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalPaid = useMemo(
    () =>
      rows
        .filter((r) => r.statusEnum === "PAID")
        .reduce((acc, r) => acc + r.netCents, 0) / 100,
    [rows]
  );

  return (
    <main className="space-y-6">
      <DashboardPageHeader
        title="Payouts"
        subtitle="Request payouts and view your payout history."
        rightSlot={
          <span className="hidden sm:inline-flex items-center rounded-full border px-3 py-1 text-xs text-gray-700">
            Total paid: ${totalPaid.toFixed(2)}
          </span>
        }
      />

      {/* Inline alert if fetch failed */}
      {err && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-800 p-3 text-sm">
          {err} — showing empty results.
        </div>
      )}

      {/* Request payout + balance info */}
      {/* Replace 56.78 with a real approved balance from API when ready */}
      <PayoutInfoCard approvedTotal={56.78} threshold={5} />

      {/* History */}
      <section className="rounded-xl border bg-white">
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4">
          <h2 className="text-sm sm:text-base font-medium">History</h2>
          <span className="sm:hidden inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] text-gray-700">
            Paid: ${totalPaid.toFixed(2)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-left z-10">
              <tr>
                <th className="p-3 sm:p-3">Date</th>
                <th className="p-3 sm:p-3">Amount</th>
                <th className="p-3 sm:p-3 hidden sm:table-cell">Provider</th>
                <th className="p-3 sm:p-3 hidden md:table-cell">Destination</th>
                <th className="p-3 sm:p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-6 text-gray-500" colSpan={5}>
                    Loading…
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3 align-middle">
                      <div className="whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleString()}
                      </div>
                      {/* Mobile-only: provider + destination below date */}
                      <div className="mt-0.5 text-xs text-gray-500 sm:hidden">
                        {p.provider} · {p.receiverEmail ?? "—"}
                      </div>
                    </td>
                    <td className="p-3 align-middle font-medium">
                      ${formatMoney(p.netCents)}
                    </td>
                    <td className="p-3 align-middle hidden sm:table-cell">
                      {p.provider}
                    </td>
                    <td className="p-3 align-middle hidden md:table-cell">
                      {p.receiverEmail ?? "—"}
                    </td>
                    <td className="p-3 align-middle">
                      <StatusBadge status={p.statusEnum as any} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-6 text-gray-500" colSpan={5}>
                    No payouts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sticky request action on small screens (optional helper) */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-30">
        <div className="mx-auto max-w-xl px-4 pb-4">
          <div className="rounded-2xl bg-white/80 backdrop-blur border shadow p-3">
            <button
              className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium py-3"
              onClick={() => {
                const el = document.getElementById("payout-request");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                else window.location.hash = "request";
              }}
            >
              Request Payout
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function formatMoney(cents: number) {
  return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}
