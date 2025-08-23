"use client";

export const revalidate = 0;
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user?: { email?: string | null; name?: string | null };
};

type PayAllResp = {
  success: boolean;
  paid: number;
  totalAmount: number;
  items: Array<{ id: string; userId: string; email?: string; amount: number }>;
  dryRun: boolean;
  message?: string;
  error?: string;
};

export default function AdminPayoutsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<{ kind: "ok" | "warn" | "err"; msg: string } | null>(null);
  const [filter, setFilter] = useState("");

  async function load() {
    setLoading(true);
    setBanner(null);
    try {
      // Pull recent commissions and filter to Approved & unpaid in the UI
      const r = await fetch("/api/admin/commissions?limit=200", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || `HTTP ${r.status}`);
      const items: Row[] = (j.items || []).map((x: any) => ({
        id: x.id,
        amount: Number(x.amount),
        status: x.status,
        createdAt: x.createdAt,
        user: x.user,
        paidOut: x.paidOut,
      }));
      setRows(items);
    } catch (e: any) {
      setBanner({ kind: "err", msg: e.message || "Failed to load commissions" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const view = useMemo(() => {
    const emailFilter = filter.trim().toLowerCase();
    return rows
      .filter((r) => r.status === "Approved") // eligible
      .filter((r) => (emailFilter ? (r.user?.email || "").toLowerCase().includes(emailFilter) : true))
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  }, [rows, filter]);

  const inViewTotal = useMemo(() => view.reduce((s, x) => s + (x.amount || 0), 0), [view]);

  async function runPayAll(dryRun: boolean) {
    setLoading(true);
    setBanner(null);
    try {
      const url = new URL("/api/admin/pay-all", window.location.origin);
      if (dryRun) url.searchParams.set("dryRun", "true");
      // Optionally limit to what’s in view by using server-side filters later;
      // for now we just let the endpoint compute all Approved & unpaid.
      const r = await fetch(url.toString(), { method: "POST" });
      const j: PayAllResp = await r.json();

      if (!r.ok || !j.success) {
        throw new Error(j.error || `HTTP ${r.status}`);
      }

      // Show a friendly banner
      const title = dryRun ? "Dry-run result" : "Payout complete";
      setBanner({
        kind: "ok",
        msg: `${title}\nItems: ${j.paid}${dryRun ? "" : ""}\nTotal Amount: $${j.totalAmount.toFixed(2)}`,
      });

      // Refresh list after a real payout; for dry-run we still refresh to be safe
      await load();
    } catch (e: any) {
      setBanner({ kind: "err", msg: e.message || "Payout error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin · Payouts</h1>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-xl px-3 py-2 text-sm ring-1 ring-zinc-300 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Filter + actions */}
      <div className="flex items-center gap-3">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="user@example.com"
          className="rounded-lg ring-1 ring-zinc-300 px-3 py-2 text-sm w-64"
        />
        <button
          onClick={load}
          className="rounded-lg px-3 py-2 text-sm ring-1 ring-zinc-300"
        >
          Apply Filter
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => runPayAll(true)}
            disabled={loading}
            className="rounded-xl px-3 py-2 text-sm ring-1 ring-zinc-300 disabled:opacity-50"
          >
            Dry-Run (All in view)
          </button>
          <button
            onClick={() => runPayAll(false)}
            disabled={loading}
            className="rounded-xl px-3 py-2 text-sm bg-emerald-600 text-white disabled:opacity-50"
          >
            Pay All
          </button>
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`whitespace-pre-wrap rounded-xl p-3 text-sm ${
            banner.kind === "ok"
              ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
              : banner.kind === "warn"
              ? "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-200"
              : "bg-red-50 text-red-800 ring-1 ring-red-200"
          }`}
        >
          {banner.msg}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl ring-1 ring-zinc-200 overflow-x-auto bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-left">
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">ID</th>
            </tr>
          </thead>
          <tbody>
            {view.length === 0 ? (
              <tr>
                <td className="px-3 py-8 text-zinc-500" colSpan={6}>
                  No approved/unpaid commissions in the queue.
                </td>
              </tr>
            ) : (
              view.map((r) => (
                <tr key={r.id} className="border-t border-zinc-200">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{r.user?.email || "—"}</td>
                  <td className="px-3 py-2">{r.user?.name || "—"}</td>
                  <td className="px-3 py-2">${(Number(r.amount) || 0).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs max-w-[28ch] truncate" title={r.id}>
                    {r.id}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-zinc-600">
        In view total: <strong>${inViewTotal.toFixed(2)}</strong>
      </div>
    </div>
  );
}
