// app/admin/warnings/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Warning = {
  id?: string;
  userId: string;
  type: string;
  message: string;
  createdAt?: string;
  evidence?: unknown;
};

type ApiListResponse = {
  ok: boolean;
  count: number;
  warnings: Warning[];
  error?: string;
};

export default function AdminWarningsPage() {
  const [data, setData] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [limit, setLimit] = useState(200);
  const [qUser, setQUser] = useState("");
  const [qType, setQType] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/warnings/list?limit=${limit}`, {
        headers: {
          // If you’ve set the admin cookie via /admin/enter-key, cookie will auth.
          // For local testing you could temporarily add x-admin-key here.
        },
        cache: "no-store",
      });
      const json: ApiListResponse = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to load warnings");
      setData(json.warnings || []);
      setLastRefreshed(new Date().toLocaleString());
    } catch (e: any) {
      setErr(e?.message || "Failed to load warnings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 30_000); // refresh every 30s
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, limit]);

  const filtered = useMemo(() => {
    return data.filter((w) => {
      if (qUser && !w.userId.toLowerCase().includes(qUser.toLowerCase())) return false;
      if (qType && !w.type.toLowerCase().includes(qType.toLowerCase())) return false;
      return true;
    });
  }, [data, qUser, qType]);

  function exportCsv() {
    // Build CSV from the currently filtered set
    const rows = filtered;
    const header = ["id", "userId", "type", "message", "createdAt", "evidenceJSON"];
    const csvLines = [header.join(",")];

    for (const w of rows) {
      const id = safeCsv(w.id ?? "");
      const userId = safeCsv(w.userId);
      const type = safeCsv(w.type);
      const message = safeCsv(w.message);
      const created = safeCsv(w.createdAt ? new Date(w.createdAt).toISOString() : "");
      const evidence = safeCsv(JSON.stringify(w.evidence ?? null));
      csvLines.push([id, userId, type, message, created, evidence].join(","));
    }

    const csv = csvLines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `warnings-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function safeCsv(val: string) {
    // Escape double-quotes and wrap in quotes; avoids commas/linebreaks issues
    const s = (val ?? "").toString().replace(/"/g, '""');
    return `"${s}"`;
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Admin · Warnings</h1>
          <div className="text-xs text-gray-500">
            {lastRefreshed ? `Last refresh: ${lastRefreshed}` : "—"}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>

          <label className="flex items-center gap-2 text-sm">
            <span>Limit</span>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value, 10))}
              className="rounded-md border px-2 py-1"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4"
            />
            <span>Auto-refresh (30s)</span>
          </label>

          {/* Export CSV for filtered rows */}
          <button
            onClick={exportCsv}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            title="Download filtered warnings as CSV"
          >
            Export CSV
          </button>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <input
              value={qUser}
              onChange={(e) => setQUser(e.target.value)}
              placeholder="Filter by userId"
              className="w-48 rounded-lg border px-3 py-2 text-sm"
            />
            <input
              value={qType}
              onChange={(e) => setQType(e.target.value)}
              placeholder="Filter by type (e.g. RATE_LIMIT…)"
              className="w-60 rounded-lg border px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Message</th>
                  <th className="px-3 py-2">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                      {loading ? "Loading…" : "No warnings found."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((w, i) => (
                    <tr key={w.id ?? `${w.userId}-${w.type}-${i}`} className="border-t">
                      <td className="px-3 py-2 align-top">
                        {w.createdAt ? new Date(w.createdAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span className="rounded-md bg-amber-100 px-2 py-1 font-mono text-xs text-amber-700">
                          {w.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span className="font-mono text-xs">{w.userId}</span>
                      </td>
                      <td className="px-3 py-2 align-top">{w.message}</td>
                      <td className="px-3 py-2 align-top">
                        <pre className="max-h-32 overflow-auto rounded-md bg-gray-50 p-2 text-xs">
{JSON.stringify(w.evidence ?? null, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Showing {filtered.length} of {data.length} loaded (limit {limit}).
          </p>
        </div>

        {err && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}
      </section>
    </main>
  );
}
