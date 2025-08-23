"use client";

import { useEffect, useState } from "react";

type Summary = { pending: number; approved: number; paid: number };

type RecentItem = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  inviteeShare: number;
  referrerShare: number;
  platformShare: number;
};

export default function CommissionCard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function loadSummary() {
    const r = await fetch("/api/user/commissions/summary", { cache: "no-store" });
    const j = await r.json();
    if (!r.ok || j.error) throw new Error(j.error || `HTTP ${r.status}`);
    setSummary(j);
  }

  async function loadRecent(next?: string | null) {
    const url = new URL("/api/user/commissions/recent", window.location.origin);
    url.searchParams.set("limit", "5");
    if (next) url.searchParams.set("cursor", next);
    const r = await fetch(url.toString(), { cache: "no-store" });
    const j = await r.json();
    if (!r.ok || !j.success) throw new Error(j.error || `HTTP ${r.status}`);
    setRecent((prev) => (next ? [...prev, ...j.items] : j.items));
    setCursor(j.nextCursor ?? null);
  }

  async function refreshAll() {
    try {
      setLoading(true);
      setErr(null);
      await Promise.all([loadSummary(), loadRecent(null)]);
    } catch (e: any) {
      setErr(e.message || "Failed to load commissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl ring-1 ring-zinc-200 p-5 bg-white/70 dark:bg-zinc-900/70">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">Your Commissions</div>
          <h2 className="text-xl font-semibold mt-1">Summary & Recent</h2>
        </div>
        <button
          onClick={refreshAll}
          disabled={loading}
          className="rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-zinc-300 dark:ring-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {err && (
        <div className="mt-3 rounded-lg bg-red-50 text-red-800 ring-1 ring-red-200 p-2 text-sm">{err}</div>
      )}

      {/* Totals */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Pending" value={money(summary?.pending ?? 0)} />
        <Stat label="Approved" value={money(summary?.approved ?? 0)} />
        <Stat label="Paid" value={money(summary?.paid ?? 0)} />
      </div>

      {/* Recent list with 80/5/15 split */}
      <div className="mt-6">
        <div className="text-sm font-medium mb-2">Recent commissions (80/5/15 split)</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50">
              <tr className="text-left">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Invitee 80%</th>
                <th className="px-3 py-2">Referrer 5%</th>
                <th className="px-3 py-2">Platform 15%</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">ID</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-zinc-500" colSpan={7}>
                    No commissions yet.
                  </td>
                </tr>
              ) : (
                recent.map((c) => (
                  <tr key={c.id} className="border-t border-zinc-200">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">{money(c.amount)}</td>
                    <td className="px-3 py-2">{money(c.inviteeShare)}</td>
                    <td className="px-3 py-2">{money(c.referrerShare)}</td>
                    <td className="px-3 py-2">{money(c.platformShare)}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs">
                        {c.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs max-w-[28ch] truncate" title={c.id}>
                      {c.id}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3">
          <button
            onClick={() => loadRecent(cursor)}
            disabled={!cursor || loading}
            className="text-sm rounded-lg px-3 py-2 ring-1 ring-zinc-300 disabled:opacity-50"
          >
            {loading ? "Loading…" : cursor ? "Load more" : "No more"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl ring-1 ring-zinc-200 p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function money(n: number) {
  return `$${(Math.round(n * 100) / 100).toFixed(2)}`;
}
