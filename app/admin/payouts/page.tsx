"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  userId: string;
  amount: number;
  status: "Pending" | "Approved" | "Paid" | "Rejected";
  paidOut: boolean;
  type: string | null;
  source: string | null;
  description: string | null;
  createdAt: string; // iso
  user?: { email: string | null };
};

const STATUSES = ["Pending", "Approved", "Paid", "Rejected"] as const;

export default function AdminPayoutsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<(typeof STATUSES)[number] | "">("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const totalByStatus = useMemo(() => {
    const t: Record<string, number> = {};
    for (const s of STATUSES) t[s] = 0;
    for (const r of rows) t[r.status] += r.amount ?? 0;
    return t;
  }, [rows]);

  async function load(next?: string | null, reset = false) {
    try {
      setLoading(true);
      setErr(null);
      const url = new URL("/api/admin/commissions", window.location.origin);
      url.searchParams.set("limit", "20");
      if (next) url.searchParams.set("cursor", next);
      if (status) url.searchParams.set("status", status);
      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      setRows((prev) => (reset ? json.rows : next ? [...prev, ...json.rows] : json.rows));
      setCursor(json.nextCursor ?? null);
    } catch (e: any) {
      setErr(e.message || "Failed to load commissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function act(id: string, action: "approve" | "pay" | "reject") {
    try {
      setBusyId(id);
      const res = await fetch(`/api/admin/commissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      const updated = json.commission as Row;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
    } catch (e: any) {
      alert(e.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin · Payouts</h1>
          <p className="text-sm text-slate-600 mt-1">
            View and act on commissions (approve, mark paid, reject)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="text-sm rounded-md px-2 py-1 ring-1 ring-zinc-300 bg-white"
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={() => load(null, true)}
            className="text-sm rounded-md px-3 py-2 ring-1 ring-zinc-300 hover:bg-zinc-50"
          >
            Refresh
          </button>
        </div>
      </header>

      {err && (
        <div className="rounded-xl bg-red-50 text-red-800 ring-1 ring-red-200 p-3 text-sm">
          {err}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUSES.map((s) => (
          <div key={s} className="rounded-lg border p-3 text-sm">
            <div className="text-xs text-slate-500">{s}</div>
            <div className="mt-1 text-lg font-semibold">
              ${totalByStatus[s].toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl ring-1 ring-zinc-200">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-left">
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Actions</th>
              <th className="px-4 py-3">ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading ? (
              <tr>
                <td className="px-4 py-6 text-zinc-500" colSpan={9}>
                  No commissions found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-zinc-200 align-middle">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{r.user?.email ?? r.userId}</td>
                  <td className="px-4 py-3 font-medium">
                    ${Number(r.amount ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{r.type ?? "—"}</td>
                  <td className="px-4 py-3">{r.source ?? "—"}</td>
                  <td className="px-4 py-3 max-w-[28ch] truncate" title={r.description ?? ""}>
                    {r.description ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => act(r.id, "approve")}
                        disabled={busyId === r.id || r.status === "Approved" || r.status === "Paid"}
                        className="text-xs rounded-md px-2 py-1 ring-1 ring-sky-300 disabled:opacity-50 hover:bg-sky-50"
                        title="Approve"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => act(r.id, "pay")}
                        disabled={busyId === r.id || r.status !== "Approved" || r.paidOut}
                        className="text-xs rounded-md px-2 py-1 ring-1 ring-emerald-300 disabled:opacity-50 hover:bg-emerald-50"
                        title="Mark Paid"
                      >
                        Mark Paid
                      </button>
                      <button
                        onClick={() => act(r.id, "reject")}
                        disabled={busyId === r.id || r.status === "Paid"}
                        className="text-xs rounded-md px-2 py-1 ring-1 ring-red-300 disabled:opacity-50 hover:bg-red-50"
                        title="Reject"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs max-w-[32ch] truncate" title={r.id}>
                    {r.id}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => load(cursor)}
          disabled={!cursor || loading}
          className="text-sm rounded-lg px-3 py-2 ring-1 ring-zinc-300 disabled:opacity-50"
        >
          {loading ? "Loading..." : cursor ? "Load more" : "No more"}
        </button>
      </div>
    </main>
  );
}
