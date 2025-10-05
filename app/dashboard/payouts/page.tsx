// app/dashboard/payouts/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  amountPhp: number;
  method: "GCASH" | "BANK";
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED";
  requestedAt: string;
  processedAt: string | null;
  processorNote: string | null;
};

export default function PayoutsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/payouts/mine", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load");
      }
      setItems(data.items || []);
    } catch (e: any) {
      setErr(e?.message || "Error loading payouts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Payouts</h1>
          <p className="text-sm text-gray-600">Your payout requests and status</p>
        </div>
        <Link
          href="/dashboard"
          className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
        >
          ← Back to Overview
        </Link>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={load}
          className="px-3 py-2 rounded-lg border text-sm"
        >
          Refresh
        </button>
        <span className="text-xs text-gray-600">
          New payout? Use the <strong>Request Payout</strong> button on the Overview page.
        </span>
      </div>

      {/* Table / states */}
      {loading ? (
        <div className="rounded-2xl border p-6 text-sm text-gray-600">Loading…</div>
      ) : err ? (
        <div className="rounded-2xl border p-6 text-sm text-red-600">{err}</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border p-6 text-sm text-gray-600">
          No payout requests yet.
        </div>
      ) : (
        <div className="rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Requested</th>
                <th className="text-left p-3">Amount (₱)</th>
                <th className="text-left p-3">Method</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Processed</th>
                <th className="text-left p-3">Note</th>
                <th className="text-left p-3">ID</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">
                    {new Date(r.requestedAt).toLocaleString()}
                  </td>
                  <td className="p-3 font-medium">{r.amountPhp.toLocaleString()}</td>
                  <td className="p-3">{r.method}</td>
                  <td className="p-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="p-3">
                    {r.processedAt ? new Date(r.processedAt).toLocaleString() : "—"}
                  </td>
                  <td className="p-3">{r.processorNote ?? "—"}</td>
                  <td className="p-3 text-[11px] text-gray-600">{r.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Row["status"] }) {
  const styles: Record<Row["status"], string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
    PROCESSING: "bg-blue-100 text-blue-800 border-blue-300",
    PAID: "bg-green-100 text-green-800 border-green-300",
    FAILED: "bg-red-100 text-red-800 border-red-300",
  };
  return (
    <span className={`px-2 py-1 rounded-full border text-xs ${styles[status]}`}>
      {status}
    </span>
  );
}
