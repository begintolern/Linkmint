// app/admin/warnings/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Warning = {
  id?: string | null;
  userId?: string | null;
  type?: string | null;
  message?: string | null;
  createdAt?: string | null;
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
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  // form inputs (not applied until "Apply")
  const [qUserInput, setQUserInput] = useState("");
  const [qTypeInput, setQTypeInput] = useState("");

  // applied filters (used by table)
  const [qUser, setQUser] = useState("");
  const [qType, setQType] = useState("");

  // details modal
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Warning | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/warnings/list?limit=${limit}`, {
        cache: "no-store",
      });
      const json: ApiListResponse = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to load warnings");
      setData(Array.isArray(json.warnings) ? json.warnings : []);
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
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, limit]);

  const filtered = useMemo(() => {
    const u = (qUser || "").toLowerCase();
    const t = (qType || "").toLowerCase();
    return (data || []).filter((w) => {
      const userId = ((w?.userId ?? "") + "").toLowerCase();
      const type = ((w?.type ?? "") + "").toLowerCase();
      if (u && !userId.includes(u)) return false;
      if (t && !type.includes(t)) return false;
      return true;
    });
  }, [data, qUser, qType]);

  function applyFilters() {
    setQUser(qUserInput.trim());
    setQType(qTypeInput.trim());
  }

  function clearFilters() {
    setQUserInput("");
    setQTypeInput("");
    setQUser("");
    setQType("");
  }

  function exportCsv() {
    try {
      const rows = filtered || [];
      const header = ["id", "userId", "type", "message", "createdAt", "evidenceJSON"];
      const csvLines = [header.join(",")];

      for (const w of rows) {
        const id = csvSafe(w?.id ?? "");
        const userId = csvSafe(w?.userId ?? "");
        const type = csvSafe(w?.type ?? "");
        const message = csvSafe(w?.message ?? "");
        const created = csvSafe(w?.createdAt ? new Date(w.createdAt).toISOString() : "");
        const evidence = csvSafe(stringifySafe(w?.evidence));
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
    } catch (e) {
      console.error("Export CSV failed:", e);
      alert("Export failed. See console for details.");
    }
  }

  function csvSafe(val: unknown) {
    const s = (val ?? "").toString().replace(/"/g, '""');
    return `"${s}"`;
  }

  function stringifySafe(obj: unknown) {
    try {
      return JSON.stringify(obj ?? null, null, 2);
    } catch {
      return '"[unstringifiable]"';
    }
  }

  function openDetails(w: Warning) {
    setSelected(w);
    setOpen(true);
  }

  async function copyJson() {
    try {
      const payload = {
        id: selected?.id ?? null,
        userId: selected?.userId ?? null,
        type: selected?.type ?? null,
        message: selected?.message ?? null,
        createdAt: selected?.createdAt ?? null,
        evidence: selected?.evidence ?? null,
      };
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      alert("Copied JSON to clipboard");
    } catch {
      alert("Copy failed");
    }
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

          <button
            onClick={exportCsv}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            title="Download filtered warnings as CSV"
          >
            Export CSV
          </button>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <input
              value={qUserInput}
              onChange={(e) => setQUserInput(e.target.value)}
              placeholder="Filter by userId"
              className="w-48 rounded-lg border px-3 py-2 text-sm"
            />
            <input
              value={qTypeInput}
              onChange={(e) => setQTypeInput(e.target.value)}
              placeholder="Filter by type (e.g. RATE_LIMIT…)"
              className="w-60 rounded-lg border px-3 py-2 text-sm"
            />
            <button
              onClick={applyFilters}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              title="Apply current filters"
            >
              Apply
            </button>
            <button
              onClick={clearFilters}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              title="Clear filters"
            >
              Clear
            </button>
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
                    <tr
                      key={w.id ?? `${w.userId}-${w.type}-${i}`}
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => openDetails(w)}
                      title="Click to view details"
                    >
                      <td className="px-3 py-2 align-top">
                        {w?.createdAt ? new Date(w.createdAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span className="rounded-md bg-amber-100 px-2 py-1 font-mono text-xs text-amber-700">
                          {(w?.type ?? "—").toString()}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span className="font-mono text-xs">{(w?.userId ?? "—").toString()}</span>
                      </td>
                      <td className="px-3 py-2 align-top">{(w?.message ?? "—").toString()}</td>
                      <td className="px-3 py-2 align-top">
                        <pre className="max-h-24 overflow-auto rounded-md bg-gray-50 p-2 text-xs">
{stringifySafe(w?.evidence)}
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

      {/* Details Modal */}
      {open && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-[min(92vw,720px)] rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Warning details</h2>
              <button
                className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Field label="ID" value={selected?.id ?? "—"} />
              <Field label="User" value={selected?.userId ?? "—"} />
              <Field label="Type" value={selected?.type ?? "—"} />
              <Field
                label="Created"
                value={
                  selected?.createdAt
                    ? new Date(selected.createdAt).toLocaleString()
                    : "—"
                }
              />
              <div className="col-span-2">
                <div className="text-xs text-gray-600 mb-1">Message</div>
                <div className="rounded-md border bg-gray-50 p-2 text-sm">
                  {(selected?.message ?? "—").toString()}
                </div>
              </div>
              <div className="col-span-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-600 mb-1">Evidence (JSON)</div>
                  <button
                    onClick={copyJson}
                    className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                    title="Copy JSON"
                  >
                    Copy JSON
                  </button>
                </div>
                <pre className="max-h-[50vh] overflow-auto rounded-md border bg-gray-50 p-2 text-xs">
{stringifySafe({
  id: selected?.id ?? null,
  userId: selected?.userId ?? null,
  type: selected?.type ?? null,
  message: selected?.message ?? null,
  createdAt: selected?.createdAt ?? null,
  evidence: selected?.evidence ?? null,
})}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900 truncate max-w-[60%]">
        {value}
      </span>
    </div>
  );
}
