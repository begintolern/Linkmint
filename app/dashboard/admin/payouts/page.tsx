// app/dashboard/admin/payouts/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPayoutSummaryCard from "../../../components/AdminPayoutSummaryCard";

type Item = {
  id: string;
  amountPhp: number;
  method: "GCASH" | "BANK";
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED";
  requestedAt: string;
  processedAt: string | null;
  processorNote: string | null;
  user: { email: string | null; name: string | null } | null;
};

const STATUS_OPTIONS = ["PENDING", "PROCESSING", "PAID", "FAILED"] as const;

export default function AdminPayoutsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    (typeof STATUS_OPTIONS)[number] | "ALL"
  >("ALL");
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [workingId, setWorkingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/payout-requests", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setItems(data.items || []);
    } catch (e: any) {
      setErr(e?.message || "Error loading payout requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return items;
    return items.filter((r) => r.status === statusFilter);
  }, [items, statusFilter]);

  async function markPaid(id: string) {
    try {
      setWorkingId(id);
      const note = noteById[id]?.trim() || "";
      const res = await fetch(`/api/admin/payouts/${id}/mark-paid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin": "true",
        },
        body: JSON.stringify({ processorNote: note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to mark paid");
      await load();
    } catch (e: any) {
      alert(e?.message || "Error marking paid");
    } finally {
      setWorkingId(null);
    }
  }

  async function markFailed(id: string) {
    try {
      setWorkingId(id);
      const note = noteById[id]?.trim() || "";
      const res = await fetch(`/api/admin/payouts/${id}/mark-failed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin": "true",
        },
        body: JSON.stringify({ processorNote: note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to mark failed");
      await load();
    } catch (e: any) {
      alert(e?.message || "Error marking failed");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Summary */}
      <AdminPayoutSummaryCard />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Admin · Payouts</h1>
          <p className="text-sm text-gray-600">Review and process payout requests</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg border text-sm"
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
          </select>
          <button onClick={load} className="px-3 py-2 rounded-lg border text-sm">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border p-6 text-sm text-gray-600">Loading…</div>
      ) : err ? (
        <div className="rounded-2xl border p-6 text-sm text-red-600">{err}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border p-6 text-sm text-gray-600">No payout requests found.</div>
      ) : (
        <div className="rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Requested</th>
                <th className="text-left p-3">User</th>
                <th className="text-left p-3">Amount (₱)</th>
                <th className="text-left p-3">Method</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Processed</th>
                <th className="text-left p-3">Note</th>
                <th className="text-left p-3">Actions</th>
                <th className="text-left p-3">ID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="p-3 whitespace-nowrap">
                    {new Date(r.requestedAt).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{r.user?.name || r.user?.email || "—"}</div>
                    <div className="text-xs text-gray-600">{r.user?.email || "—"}</div>
                  </td>
                  <td className="p-3 font-semibold">{r.amountPhp.toLocaleString()}</td>
                  <td className="p-3">{r.method}</td>
                  <td className="p-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {r.processedAt ? new Date(r.processedAt).toLocaleString() : "—"}
                  </td>
                  <td className="p-3 w-[260px]">
                    <input
                      className="w-full rounded border px-2 py-1"
                      placeholder="Reference / reason"
                      value={noteById[r.id] ?? (r.processorNote ?? "")}
                      onChange={(e) =>
                        setNoteById((prev) => ({ ...prev, [r.id]: e.target.value }))
                      }
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => markPaid(r.id)}
                        disabled={workingId === r.id || r.status === "PAID"}
                        className="px-3 py-1 rounded bg-black text-white disabled:opacity-50"
                        title="Mark as PAID"
                      >
                        {workingId === r.id ? "Saving…" : "Mark Paid"}
                      </button>
                      <button
                        onClick={() => markFailed(r.id)}
                        disabled={workingId === r.id || r.status === "FAILED" || r.status === "PAID"}
                        className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-50"
                        title="Mark as FAILED"
                      >
                        {workingId === r.id ? "Saving…" : "Mark Failed"}
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-xs text-gray-600">{r.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED";
}) {
  const styles: Record<string, string> = {
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
