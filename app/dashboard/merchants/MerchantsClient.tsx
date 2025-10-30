// app/dashboard/merchants/MerchantsClient.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Merchant = {
  id: string;
  merchantName: string | null;
  market: string | null; // "PH" | "US" | ...
  network: string | null;
  domainPattern: string | null;
  commissionRate: string | null; // e.g. "0.05"
  commissionType: string | null; // e.g. "PERCENT"
  status: string | null; // e.g. "PENDING"
  updatedAt?: string;
  createdAt?: string;
};

type ApiListResp = {
  ok: boolean;
  page: number;
  limit: number;
  total: number;
  canViewAll: boolean;
  items: Merchant[];
};

export default function MerchantsClient(props: {
  isAdmin: boolean;
  initialRegion?: string;
  initialAll?: boolean;
}) {
  const { isAdmin, initialRegion = "", initialAll = false } = props;
  const router = useRouter();
  const sp = useSearchParams()!;

  // Local filters state mirrors URL
  const [region, setRegion] = useState<string>(initialRegion);
  const [all, setAll] = useState<boolean>(!!initialAll);

  // Data state
  const [loading, setLoading] = useState<boolean>(true);
  const [items, setItems] = useState<Merchant[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(25);
  const [total, setTotal] = useState<number>(0);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  // Build query string for the API based on filters
  const buildApiUrl = useCallback(
    (nextPage?: number) => {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("page", String(nextPage ?? page));

      // For PH-only launch the API enforces:
      // - only admins can use all=1 (see all regions)
      // - non-admins are locked to PH on the server side
      if (isAdmin && all) {
        params.set("all", "1");
      } else {
        if (region) params.set("region", region.toUpperCase());
      }

      return `/api/merchant-rules/list?${params.toString()}`;
    },
    [all, isAdmin, limit, page, region]
  );

  // Push filter state into the URL (address bar), so links are shareable
  const syncUrl = useCallback(
    (nextPage?: number, nextRegion?: string, nextAll?: boolean) => {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("page", String(nextPage ?? page));

      if (isAdmin && (nextAll ?? all)) {
        params.set("all", "1");
      } else {
        const r = (nextRegion ?? region).toUpperCase();
        if (r) params.set("region", r);
      }

      const qs = params.toString();
      router.replace(`/dashboard/merchants?${qs}`);
    },
    [router, limit, page, region, all, isAdmin]
  );

  // Fetch list
  const load = useCallback(
    async (nextPage?: number) => {
      try {
        setLoading(true);
        const url = buildApiUrl(nextPage);
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ApiListResp = await res.json();
        if (!data.ok) throw new Error("Server error");
        setItems(data.items || []);
        setTotal(data.total || 0);
        if (typeof nextPage === "number") setPage(nextPage);
      } catch (e) {
        console.error("load merchants failed:", e);
        alert("Failed to load merchants.");
      } finally {
        setLoading(false);
      }
    },
    [buildApiUrl]
  );

  // On mount/read URL -> hydrate filters
  useEffect(() => {
    const spAll = sp?.get("all");
    const spRegion = sp?.get("region");
    const spPage = sp?.get("page");


    if (isAdmin) {
      setAll(spAll === "1" || spAll === "true");
    } else {
      setAll(false);
    }
    if (spRegion) setRegion(spRegion.toUpperCase());
    if (spPage) {
      const p = parseInt(spPage, 10);
      if (Number.isFinite(p) && p > 0) setPage(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(page);
  }, [load]);

  // Handlers
  const handleRegionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRegion = e.target.value;
    setRegion(nextRegion);
    setAll(false); // selecting a region disables "All"
    syncUrl(1, nextRegion, false);
    await load(1);
  };

  const handleAllToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextAll = e.target.checked;
    setAll(nextAll);
    // when all=true, we ignore region
    syncUrl(1, "", nextAll);
    await load(1);
  };

  const handlePrev = async () => {
    if (page <= 1) return;
    const np = page - 1;
    syncUrl(np);
    await load(np);
  };

  const handleNext = async () => {
    if (page >= totalPages) return;
    const np = page + 1;
    syncUrl(np);
    await load(np);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    const yes = confirm("Delete this merchant rule?");
    if (!yes) return;
    try {
      const res = await fetch(`/api/merchant-rules/${id}`, {
        method: "DELETE",
        cache: "no-store",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      await load(page);
    } catch (e: any) {
      console.error("delete failed:", e);
      alert("Delete failed: " + (e?.message || "Unknown error"));
    }
  };

  return (
    <section className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {isAdmin ? (
          <>
            <label className="text-sm font-medium">Region</label>
            <select
              value={all ? "" : region.toUpperCase()}
              onChange={handleRegionChange}
              disabled={all}
              className="border rounded-md px-2 py-1 text-sm"
            >
              <option value="">(none)</option>
              <option value="PH">PH</option>
              <option value="US">US</option>
            </select>

            <label className="ml-4 inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={all}
                onChange={handleAllToggle}
              />
              All Regions (admin)
            </label>
          </>
        ) : (
          <div className="text-sm">
            <span className="font-medium">Region:</span> PH (locked)
          </div>
        )}
      </div>

      {/* List */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-3 py-2">Merchant</th>
              <th className="text-left px-3 py-2">Market</th>
              <th className="text-left px-3 py-2">Network</th>
              <th className="text-left px-3 py-2">Domain</th>
              <th className="text-left px-3 py-2">Rate</th>
              <th className="text-left px-3 py-2">Status</th>
              {isAdmin && <th className="px-3 py-2 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-4" colSpan={isAdmin ? 7 : 6}>
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-gray-500" colSpan={isAdmin ? 7 : 6}>
                  No merchants found for this view.
                </td>
              </tr>
            ) : (
              items.map((m) => {
                const rate =
                  m.commissionType === "PERCENT" && m.commissionRate
                    ? `${(Number(m.commissionRate) * 100).toFixed(0)}%`
                    : m.commissionRate ?? "-";
                return (
                  <tr key={m.id} className="border-t">
                    <td className="px-3 py-2">{m.merchantName ?? "-"}</td>
                    <td className="px-3 py-2">{m.market ?? "-"}</td>
                    <td className="px-3 py-2">{m.network ?? "-"}</td>
                    <td className="px-3 py-2">{m.domainPattern ?? "-"}</td>
                    <td className="px-3 py-2">{rate}</td>
                    <td className="px-3 py-2">{m.status ?? "-"}</td>
                    {isAdmin && (
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="px-2 py-1 text-xs rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                            title="Delete rule"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <div>
          Page <span className="font-medium">{page}</span> of{" "}
          <span className="font-medium">{totalPages}</span>
          <span className="text-gray-500"> — {total} total</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            disabled={page <= 1 || loading}
            className="px-3 py-1 rounded-md border disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={handleNext}
            disabled={page >= totalPages || loading}
            className="px-3 py-1 rounded-md border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
