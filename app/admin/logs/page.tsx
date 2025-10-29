// app/admin/logs/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  createdAt: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  details: unknown | null;
};

type ApiResp = {
  ok: boolean;
  total: number;
  page: number;
  limit: number;
  rows: Row[];
  error?: string;
};

export default function AdminLogsPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // filters
  const [action, setAction] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [targetId, setTargetId] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const qs = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("page", String(page));
    sp.set("limit", String(limit));
    if (action.trim()) sp.set("action", action.trim());
    if (email.trim()) sp.set("email", email.trim());
    if (targetId.trim()) sp.set("targetId", targetId.trim());
    if (from.trim()) sp.set("from", from.trim());
    if (to.trim()) sp.set("to", to.trim());
    return sp.toString();
  }, [page, limit, action, email, targetId, from, to]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/logs?${qs}`);
      const data: ApiResp = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to fetch logs");
      setRows(data.rows || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin Action Logs</h1>

      {/* Filters */}
      <div className="grid gap-3 md:grid-cols-6">
        <input
          className="border rounded p-2"
          placeholder="Action (e.g. USER_DISABLE)"
          value={action}
          onChange={(e) => { setPage(1); setAction(e.target.value); }}
        />
        <input
          className="border rounded p-2"
          placeholder="Actor Email"
          value={email}
          onChange={(e) => { setPage(1); setEmail(e.target.value); }}
        />
        <input
          className="border rounded p-2"
          placeholder="Target ID"
          value={targetId}
          onChange={(e) => { setPage(1); setTargetId(e.target.value); }}
        />
        <input
          type="date"
          className="border rounded p-2"
          value={from}
          onChange={(e) => { setPage(1); setFrom(e.target.value); }}
        />
        <input
          type="date"
          className="border rounded p-2"
          value={to}
          onChange={(e) => { setPage(1); setTo(e.target.value); }}
        />
        <select
          className="border rounded p-2"
          value={limit}
          onChange={(e) => { setPage(1); setLimit(parseInt(e.target.value, 10)); }}
        >
          {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
          onClick={fetchLogs}
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
        <div className="text-sm text-gray-600">
          Showing {rows.length} of {total} • Page {page} / {totalPages}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr className="text-left">
              <th className="p-2">Time</th>
              <th className="p-2">Action</th>
              <th className="p-2">Actor</th>
              <th className="p-2">Target</th>
              <th className="p-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="border-t">
                <td className="p-2 whitespace-nowrap">
                  {new Date(row.createdAt).toLocaleString()}
                </td>
                <td className="p-2">
                  <span className="font-mono">{row.action}</span>
                </td>
                <td className="p-2">
                  <div className="flex flex-col">
                    <span>{row.actorEmail || "—"}</span>
                    <span className="text-xs text-gray-500">{row.actorId || "—"}</span>
                  </div>
                </td>
                <td className="p-2">
                  <div className="flex flex-col">
                    <span>{row.targetType}</span>
                    <span className="text-xs text-gray-500">{row.targetId || "—"}</span>
                  </div>
                </td>
                <td className="p-2">
                  <pre className="max-w-[520px] whitespace-pre-wrap break-words text-xs bg-gray-50 rounded p-2">
                    {row.details ? safeStringify(row.details) : "—"}
                  </pre>
                </td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr>
                <td className="p-4 text-gray-500" colSpan={5}>No logs found for the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-2 rounded border disabled:opacity-50"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
        >
          Prev
        </button>
        <button
          className="px-3 py-2 rounded border disabled:opacity-50"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages || loading}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function safeStringify(v: unknown) {
  try {
    // if details is already JSON from the DB, render compact
    if (typeof v === "string") {
      return v;
    }
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}
