// app/dashboard/admin/logs/page.tsx
"use client";

import { useEffect, useState } from "react";

type LogItem = {
  id: string;
  createdAt: string;
  status: string | null;
  receiverEmail: string | null;
  amount: number | null;
  paypalBatchId: string | null;
  transactionId: string | null;
  note: string | null;
  userId: string | null;
  user: { id: string; email: string | null; name: string | null } | null;
};

export default function AdminLogsPage() {
  const [items, setItems] = useState<LogItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load(cursor?: string | null) {
    setLoading(true);
    setErr(null);
    try {
      const url = new URL("/api/admin/payout-logs", window.location.origin);
      url.searchParams.set("take", "50");
      if (cursor) url.searchParams.set("cursor", cursor);

      const res = await fetch(url.toString(), {
        // If your adminGuard depends on cookies (role/admin), no header needed.
        // If you rely on header, uncomment the next two lines:
        // headers: {
        //   "x-admin": "true",
        // },
        cache: "no-store",
      });

      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || "Failed to fetch logs");

      if (cursor) {
        setItems((prev) => [...prev, ...data.logs]);
      } else {
        setItems(data.logs || []);
      }
      setNextCursor(data.nextCursor ?? null);
    } catch (e: any) {
      setErr(e?.message || "Error loading logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(null);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Admin · Payout Logs</h1>
          <p className="text-sm text-gray-600">Most recent payout log entries</p>
        </div>
        <button onClick={() => load(null)} className="px-3 py-2 rounded-lg border text-sm">
          Refresh
        </button>
      </div>

      {err && <div className="rounded-2xl border p-4 text-sm text-red-600">{err}</div>}

      <div className="rounded-2xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Time</th>
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Note</th>
              <th className="text-left p-3">Batch / Txn</th>
              <th className="text-left p-3">ID</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className="p-4 text-gray-600" colSpan={7}>
                  {loading ? "Loading…" : "No logs yet."}
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="p-3 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{r.user?.name || r.user?.email || "—"}</div>
                    <div className="text-xs text-gray-600">{r.user?.email || "—"}</div>
                  </td>
                  <td className="p-3">{r.amount != null ? `₱${r.amount}` : "—"}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded-full border text-xs">
                      {r.status || "—"}
                    </span>
                  </td>
                  <td className="p-3 max-w-[320px]">
                    <div className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                      {r.note || "—"}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-xs text-gray-700">
                      {r.paypalBatchId || "—"}
                      {r.transactionId ? <div>Txn: {r.transactionId}</div> : null}
                    </div>
                  </td>
                  <td className="p-3 text-xs text-gray-600">{r.id}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-600">
          Showing {items.length} {items.length === 1 ? "row" : "rows"}
        </div>
        {nextCursor ? (
          <button
            onClick={() => load(nextCursor)}
            disabled={loading}
            className="px-3 py-2 rounded-lg border text-sm"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
