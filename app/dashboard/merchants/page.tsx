"use client";

import { useEffect, useState } from "react";

type MerchantRule = {
  id: string;
  merchantName: string | null;
  network: string | null;
  market: string | null;
  allowedRegions?: string[] | null;
  updatedAt?: string;
};

type ListResp = {
  ok: boolean;
  page: number;
  limit: number;
  total: number;
  canViewAll: boolean;   // ← drives admin UI
  items: MerchantRule[];
};

export default function MerchantsPage() {
  const [rows, setRows] = useState<MerchantRule[]>([]);
  const [canViewAll, setCanViewAll] = useState(false);
  const [region, setRegion] = useState<string>("US");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  async function load() {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    // Only send region when not an admin (server ignores for admins + all=1)
    if (!canViewAll && region) params.set("region", region);
    // Always ask debug=1 while we tune; harmless in prod
    params.set("debug", "1");

    const res = await fetch(`/api/merchant-rules/list?${params.toString()}`, {
      cache: "no-store",
    });
    const data: ListResp = await res.json();
    if (!data.ok) throw new Error("Failed to load merchants");

    setRows(data.items || []);
    setTotal(data.total || 0);
    setCanViewAll(!!data.canViewAll);
  }

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, region]);

  // Admin-only delete handler (UI only; API must also enforce admin)
  async function handleDelete(id: string) {
    if (!canViewAll) return; // double-guard UI
    if (!confirm("Delete this merchant rule?")) return;
    const res = await fetch(`/api/merchant-rules/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    const j = await res.json();
    if (!j.ok) {
      alert(j.error || "Delete failed");
      return;
    }
    // refresh list
    load().catch(console.error);
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Merchants</h1>

        {/* Admin-only controls */}
        {canViewAll ? (
          <div className="flex items-center gap-3">
            <span className="text-xs px-2 py-1 rounded bg-blue-50 border border-blue-200">
              Admin view: All regions
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <label className="text-sm">Region</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={region}
              onChange={(e) => {
                setPage(1);
                setRegion(e.target.value.toUpperCase());
              }}
            >
              <option value="US">US</option>
              <option value="PH">PH</option>
              <option value="ES">ES</option>
            </select>
          </div>
        )}
      </div>

      <div className="border rounded overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Merchant</th>
              <th className="text-left p-2">Network</th>
              <th className="text-left p-2">Market</th>
              <th className="text-left p-2">Regions</th>
              <th className="text-left p-2">Updated</th>
              {/* Admin-only column */}
              {canViewAll && <th className="text-left p-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.merchantName || "-"}</td>
                <td className="p-2">{r.network || "-"}</td>
                <td className="p-2">{r.market || "-"}</td>
                <td className="p-2">
                  {(r.allowedRegions && r.allowedRegions.length > 0)
                    ? r.allowedRegions.join(", ")
                    : "—"}
                </td>
                <td className="p-2">
                  {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "—"}
                </td>
                {/* Admin-only actions */}
                {canViewAll && (
                  <td className="p-2">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan={canViewAll ? 6 : 5}>
                  No merchants found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-3">
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <div className="text-sm">
          Page {page} of {totalPages} ({total} total)
        </div>
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
