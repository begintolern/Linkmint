// app/dashboard/payouts/page.tsx
"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/payouts/list", { cache: "no-store" });
        const json = await res.json();
        setRows(json?.payouts ?? []);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Payouts</h1>
        <p className="text-sm text-gray-600">
          Your default payout method and recent payout requests.
        </p>
      </header>

      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-3">Date</th>
              <th className="p-3">Provider</th>
              <th className="p-3">Destination</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-6 text-gray-500" colSpan={5}>Loading…</td></tr>
            ) : rows.length ? (
              rows.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{new Date(p.createdAt).toLocaleString()}</td>
                  <td className="p-3">{p.provider}</td>
                  <td className="p-3">{p.receiverEmail ?? "—"}</td>
                  <td className="p-3">${(p.netCents/100).toFixed(2)}</td>
                  <td className="p-3">{p.statusEnum}</td>
                </tr>
              ))
            ) : (
              <tr><td className="p-6 text-gray-500" colSpan={5}>No payouts yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
