// app/dashboard/merchants/MerchantsClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Merchant = {
  id: string;
  merchantName: string | null;
  network: string | null;
  market: string | null;
  allowedRegions?: string[] | null;
  updatedAt?: string | null;
  active?: boolean; // ⬅️ used for "Show active only" filter
};

type Props = {
  isAdmin: boolean;
  initialRegion?: string;
  initialAll?: boolean;
};

export default function MerchantsClient({
  isAdmin,
  initialRegion = "PH",
  initialAll = false,
}: Props) {
  const [region, setRegion] = useState<string>(initialRegion);
  const [showAll, setShowAll] = useState<boolean>(initialAll && isAdmin);
  const [showOnlyActive, setShowOnlyActive] = useState<boolean>(false); // ⬅️ new
  const [items, setItems] = useState<Merchant[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("limit", "25");
    if (showAll && isAdmin) {
      sp.set("all", "1");
    } else {
      // user-scoped; region is applied server-side but we still pass it
      sp.set("region", region);
    }
    return sp.toString();
  }, [region, showAll, isAdmin]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/merchant-rules/list?${query}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data?.ok) {
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      } else {
        console.error("Load merchants failed:", data);
      }
    } catch (e) {
      console.error("Load merchants error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // @ts-ignore
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleDelete(id: string) {
    if (!isAdmin) return;
    const go = window.confirm(
      "Delete this merchant rule? This cannot be undone."
    );
    if (!go) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/merchant-rules/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        setItems((prev) => prev.filter((m) => m.id !== id));
        setTotal((t) => Math.max(0, t - 1));
      } else {
        alert(data?.error || "Delete failed");
      }
    } catch (e) {
      console.error("Delete error:", e);
      alert("Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  // Apply "active only" filter for admin
  const visibleItems = useMemo(() => {
    if (!isAdmin || !showOnlyActive) return items;
    // Treat undefined as active-safe so we don't accidentally hide older rows
    return items.filter((m) => m.active !== false);
  }, [items, isAdmin, showOnlyActive]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {!isAdmin ? (
          <div className="text-sm text-gray-500">
            Region: <span className="font-medium">PH</span> (locked for PH launch)
          </div>
        ) : (
          <>
            <label className="text-sm">Region:</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={showAll}
            >
              <option value="PH">PH</option>
              <option value="US">US</option>
              <option value="GLOBAL">GLOBAL</option>
            </select>

            <label className="ml-4 text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
              />
              View all regions (admin)
            </label>

            <label className="ml-4 text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlyActive}
                onChange={(e) => setShowOnlyActive(e.target.checked)}
              />
              Show active only
            </label>
          </>
        )}

        <button
          onClick={load}
          className="ml-auto border rounded px-3 py-1 text-sm"
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="text-sm text-gray-600">
        Showing <span className="font-medium">{visibleItems.length}</span> of{" "}
        <span className="font-medium">{total}</span>
      </div>

      <div className="overflow-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="text-left p-2">Merchant</th>
              <th className="text-left p-2">Network</th>
              <th className="text-left p-2">Market</th>
              <th className="text-left p-2">Regions</th>
              <th className="text-left p-2">Updated</th>
              {isAdmin && <th className="text-left p-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-2">{m.merchantName ?? "—"}</td>
                <td className="p-2">{m.network ?? "—"}</td>
                <td className="p-2">{m.market ?? "—"}</td>
                <td className="p-2">
                  {m.allowedRegions && m.allowedRegions.length > 0
                    ? m.allowedRegions.join(", ")
                    : "—"}
                </td>
                <td className="p-2">
                  {m.updatedAt
                    ? new Date(m.updatedAt).toLocaleString()
                    : "—"}
                </td>
                {isAdmin && (
                  <td className="p-2">
                    <button
                      onClick={() => handleDelete(m.id)}
                      disabled={deletingId === m.id}
                      className="border rounded px-2 py-1 text-xs hover:bg-red-50"
                      title="Delete merchant rule"
                    >
                      {deletingId === m.id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {visibleItems.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan={isAdmin ? 6 : 5}>
                  No merchants found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
