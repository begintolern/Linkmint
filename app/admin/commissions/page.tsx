"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  createdAt: string;
  amount: number;
  type: string;
  status: string;
  paidOut: boolean;
  source: string | null;
  description: string | null;
  user: { id: string; email: string | null; name: string | null };
  userShare: number;
  referrerShare: number;
  platformShare: number;
  hasReferrer: boolean;
};

type Filters = {
  status: string;
  type: string;
  q: string;
};

export default function AdminCommissionsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    status: "ALL",
    type: "ALL",
    q: "",
  });

  async function load(next?: string | null, replaceList: boolean = false) {
    try {
      setLoading(true);
      setErr(null);

      const url = new URL("/api/admin/commissions", window.location.origin);
      url.searchParams.set("limit", "50");
      if (next) url.searchParams.set("cursor", next);

      // ✅ Filter logic, including unpaid (pending + approved)
      if (filters.status !== "ALL") {
        if (filters.status === "unpaid") {
          url.searchParams.set("status", "PENDING,APPROVED");
        } else {
          url.searchParams.set("status", filters.status);
        }
      }

      if (filters.type !== "ALL") url.searchParams.set("type", filters.type);

      const q = filters.q.trim();
      if (q) {
        url.searchParams.set("q", q);
        url.searchParams.set("email", q);
      }

      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      const incoming: Item[] = json.items || json.rows || [];
      setItems((prev) => (replaceList || !next ? incoming : [...prev, ...incoming]));
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
  }, [filters.status, filters.type, filters.q]);

  const totals = useMemo(() => {
    const t = items.reduce(
      (acc, it) => {
        acc.count += 1;
        acc.gross += it.amount;
        acc.user += it.userShare;
        acc.ref += it.hasReferrer ? it.referrerShare : 0;
        acc.platform += it.platformShare;
        return acc;
      },
      { count: 0, gross: 0, user: 0, ref: 0, platform: 0 }
    );
    const round = (n: number) => Math.round(n * 100) / 100;
    return {
      ...t,
      gross: round(t.gross),
      user: round(t.user),
      ref: round(t.ref),
      platform: round(t.platform),
    };
  }, [items]);

  return (
    <main className="mx-auto w-full max-w-7xl px-3 py-4 md:p-6 space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl md:text-2xl font-bold">Admin · Commissions</h1>
        <button
          onClick={() => load(null, true)}
          className="text-sm rounded-lg px-3 py-2 ring-1 ring-zinc-300 hover:bg-zinc-50 self-start md:self-auto"
        >
          Refresh
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="rounded-md border px-2 py-1 text-sm"
        >
          <option value="ALL">All Status</option>
          <option value="unpaid">Unpaid (Pending + Approved)</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="PAID">Paid</option>
        </select>

        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="rounded-md border px-2 py-1 text-sm"
        >
          <option value="ALL">All Types</option>
          <option value="referral_purchase">Referral Purchase</option>
          <option value="override_bonus">Override Bonus</option>
          <option value="payout">Payout</option>
        </select>

        <input
          type="text"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          placeholder="Search email or ID"
          className="rounded-md border px-2 py-1 text-sm w-44 md:w-56"
        />
      </div>

      {err && (
        <div className="rounded-xl bg-red-50 text-red-800 ring-1 ring-red-200 p-3 text-sm">
          {err}
        </div>
      )}

      {/* Totals summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-xl ring-1 ring-zinc-200 p-3">
          <div className="text-xs text-zinc-500">Rows</div>
          <div className="text-lg font-semibold">{totals.count}</div>
        </div>
        <div className="rounded-xl ring-1 ring-zinc-200 p-3">
          <div className="text-xs text-zinc-500">Gross</div>
          <div className="text-lg font-semibold">${totals.gross.toFixed(2)}</div>
        </div>
        <div className="rounded-xl ring-1 ring-zinc-200 p-3">
          <div className="text-xs text-zinc-500">User Share</div>
          <div className="text-lg font-semibold">${totals.user.toFixed(2)}</div>
        </div>
        <div className="rounded-xl ring-1 ring-zinc-200 p-3">
          <div className="text-xs text-zinc-500">Referrer</div>
          <div className="text-lg font-semibold">${totals.ref.toFixed(2)}</div>
        </div>
        <div className="rounded-xl ring-1 ring-zinc-200 p-3">
          <div className="text-xs text-zinc-500">Platform</div>
          <div className="text-lg font-semibold">${totals.platform.toFixed(2)}</div>
        </div>
      </div>

      {/* Table – mobile-friendly */}
      <div className="w-full overflow-x-auto rounded-2xl ring-1 ring-zinc-200">
        <table className="min-w-full text-xs md:text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-left">
              <th className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">Created</th>
              <th className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">User</th>
              <th className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">Amount</th>
              <th className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap hidden md:table-cell">
                User Share
              </th>
              <th className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap hidden lg:table-cell">
                Referrer
              </th>
              <th className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap hidden lg:table-cell">
                Platform
              </th>
              <th className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap hidden md:table-cell">
                Type
              </th>
              <th className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">Status</th>
              <th className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">Paid</th>
              <th className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap hidden lg:table-cell">
                Source
              </th>
              <th className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap hidden lg:table-cell">
                Description
              </th>
              <th className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap hidden md:table-cell">
                ID
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !loading ? (
              <tr>
                <td className="px-4 py-6 text-zinc-500" colSpan={12}>
                  No commissions found.
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="border-t border-zinc-200">
                  <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap align-top">
                    {new Date(it.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 md:px-4 md:py-3 align-top">
                    <div className="font-medium truncate max-w-[18ch] md:max-w-none">
                      {it.user?.email ?? "—"}
                    </div>
                    <div className="text-xs md:text-xs text-zinc-500 truncate max-w-[18ch] md:max-w-none">
                      {it.user?.name ?? "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2 md:px-4 md:py-3 align-top">
                    ${it.amount.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 md:px-4 md:py-3 align-top hidden md:table-cell">
                    ${it.userShare.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 md:px-4 md:py-3 align-top hidden lg:table-cell">
                    {it.hasReferrer ? `$${it.referrerShare.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-3 py-2 md:px-4 md:py-3 align-top hidden lg:table-cell">
                    ${it.platformShare.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 md:px-4 md:py-3 align-top hidden md:table-cell">
                    {it.type}
                  </td>
                  <td className="px-3 py-2 md:px-4 md:py-3 align-top">
                    <span className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-xs md:text-xs">
                      {it.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 md:px-4 md:py-3 align-top">
                    {it.paidOut ? "Yes" : "No"}
                  </td>
                  <td className="px-3 py-2 md:px-4 md:py-3 align-top hidden lg:table-cell">
                    {it.source ?? "—"}
                  </td>
                  <td className="px-3 py-2 md:px-4 md:py-3 align-top hidden lg:table-cell max-w-[22ch] truncate" title={it.description ?? ""}>
                    {it.description ?? "—"}
                  </td>
                  <td
                    className="px-3 py-2 md:px-4 md:py-3 align-top hidden md:table-cell text-xs md:text-xs max-w-[30ch] truncate"
                    title={it.id}
                  >
                    {it.id}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => load(cursor, false)}
          disabled={!cursor || loading}
          className="text-sm rounded-lg px-3 py-2 ring-1 ring-zinc-300 disabled:opacity-50"
        >
          {loading ? "Loading..." : cursor ? "Load more" : "No more"}
        </button>
      </div>
    </main>
  );
}
