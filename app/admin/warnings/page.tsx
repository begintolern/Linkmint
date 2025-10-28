// app/admin/warnings/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import FreezeUserButton from "@/components/admin/FreezeUserButton";

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

  // modal state
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied!");
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
                  <th className="px-3 py-2">Actions</th>
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
                      onClick={() => setSelected(w)}
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
                      <td className="px-3 py-2 align-top">
                        {(w?.message ?? "—").toString()}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(w);
                          }}
                          className="rounded-md border px-2 py-1 text-xs hover:bg-gray-100"
                        >
                          View
                        </button>
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
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-xl ring-1 ring-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Warning Details</h2>
              <button
                onClick={() => setSelected(null)}
                className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                aria-label="Close"
              >
                Close
              </button>
            </div>

            <div className="px-4 py-3 space-y-3 text-sm">
              <Row label="ID">
                <Mono>{selected.id || "—"}</Mono>
                <CopyBtn value={selected.id || ""} onCopy={copy} />
              </Row>

              <Row label="Created">
                {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "—"}
              </Row>

              <Row label="Type">
                <span className="rounded-md bg-amber-100 px-2 py-1 font-mono text-xs text-amber-700">
                  {(selected.type ?? "—").toString()}
                </span>
                <CopyBtn value={String(selected.type ?? "")} onCopy={copy} />
              </Row>

              <Row label="User ID">
                <Mono>{selected.userId || "—"}</Mono>
                <CopyBtn value={selected.userId || ""} onCopy={copy} />
              </Row>

              <Row label="Message">
                <span className="break-words">{selected.message || "—"}</span>
                <CopyBtn value={selected.message || ""} onCopy={copy} />
              </Row>

              <div>
                <div className="mb-1 text-xs font-semibold text-gray-500">Evidence (raw)</div>
                <pre className="max-h-72 overflow-auto rounded-md bg-gray-50 p-3 text-xs">
{stringifySafe(selected.evidence)}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
              {/* Freeze action appears only if we have a valid userId */}
              {selected.userId ? <FreezeUserButton userId={selected.userId} /> : null}
              <button
                onClick={() => setSelected(null)}
                className="rounded-md border px-3 py-2 text-xs hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ---------- tiny UI helpers ---------- */

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-24 shrink-0 text-xs font-medium text-gray-500">{label}</div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-xs">{children}</span>;
}

function CopyBtn({ value, onCopy }: { value: string; onCopy: (v: string) => Promise<void> }) {
  return (
    <button
      onClick={() => onCopy(value)}
      className="rounded-md border px-2 py-1 text-xs hover:bg-gray-100"
      title="Copy to clipboard"
    >
      Copy
    </button>
  );
}
