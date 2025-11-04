// app/admin/rakuten/advertisers/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Advertiser = {
  id?: number | string;
  name?: string;
  status?: string;
  network?: number;
  categories?: string[];
  details?: string;
};

type ApiResp = {
  _metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    _links?: { next?: string | null };
    status?: string;
  };
  advertisers?: Advertiser[];
};

export default function AdvertisersAdminPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"pending" | "approved" | "declined">("pending");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ApiResp | null>(null);

  // Build a RELATIVE url (no origin) so it works in dev/prod and during prerender
  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("status", status);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    return `/api/admin/rakuten/advertisers?${params.toString()}`;
  }, [q, status, page, pageSize]);

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

  const total = data?._metadata?.total ?? 0;
  const shown = data?.advertisers?.length ?? 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Rakuten — Advertisers (from partnerships)</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as any);
              setPage(1);
            }}
            className="border rounded-lg px-3 py-2 text-sm"
            aria-label="Status filter"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
          </select>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name (e.g. noah)"
            className="border rounded-lg px-3 py-2 text-sm w-56"
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
          Page {data?._metadata?.page ?? page} · Showing {shown} of {total} · Status:{" "}
          {(data?._metadata?.status ?? status).toUpperCase()}
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
