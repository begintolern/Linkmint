"use client";

import { useEffect, useMemo, useState } from "react";

type Advertiser = {
  id?: number | string;
  name?: string;
  status?: string;
  network?: number;
  categories?: string[];
  details?: string; // API link like /v2/advertisers/:id
};

type ApiResp = {
  _metadata?: { page?: number; limit?: number; total?: number; _links?: { next?: string | null } };
  advertisers?: Advertiser[];
};

export default function AdvertisersAdminPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ApiResp | null>(null);

  const url = useMemo(() => {
    const u = new URL(typeof window !== "undefined" ? window.location.origin : "http://localhost");
    u.pathname = "/api/admin/rakuten/advertisers";
    if (q) u.searchParams.set("q", q);
    u.searchParams.set("page", String(page));
    u.searchParams.set("pageSize", String(pageSize));
    return u.toString();
  }, [q, page, pageSize]);

  async function fetchData() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }
      const json = (await res.json()) as ApiResp;
      setData(json);
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Rakuten — Advertisers</h1>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search (e.g. noah, apparel)"
            className="border rounded-lg px-3 py-2 text-sm w-64"
          />
          <button
            onClick={() => {
              setPage(1);
              fetchData();
            }}
            className="border px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </header>

      {err && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          {err}
        </div>
      )}

      <section className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 w-24">ID</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Categories</th>
              <th className="text-left px-4 py-3 w-24">Network</th>
            </tr>
          </thead>
          <tbody>
            {data?.advertisers?.length ? (
              data.advertisers.map((a, i) => (
                <tr key={`${a.id}-${i}`} className="border-t">
                  <td className="px-4 py-3">{a.id ?? "-"}</td>
                  <td className="px-4 py-3">{a.name ?? "-"}</td>
                  <td className="px-4 py-3">{a.status ?? "-"}</td>
                  <td className="px-4 py-3">
                    {a.categories && a.categories.length ? a.categories.join(", ") : "-"}
                  </td>
                  <td className="px-4 py-3">{a.network ?? "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={5}>
                  {loading ? "Loading…" : "No results"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <footer className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Page {data?._metadata?.page ?? page} · Showing {data?.advertisers?.length ?? 0} of{" "}
          {data?._metadata?.total ?? 0}
        </div>
        <div className="flex gap-2">
          <button
            className="border px-3 py-2 rounded-lg text-sm disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={loading || (data?._metadata?.page ?? 1) <= 1}
          >
            Prev
          </button>
          <button
            className="border px-3 py-2 rounded-lg text-sm disabled:opacity-50"
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  );
}
