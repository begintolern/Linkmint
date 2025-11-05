// app/admin/payouts/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Status = "PENDING" | "PROCESSING" | "PAID" | "FAILED";

type PayoutRequest = {
  id: string;
  userId: string;
  userEmail?: string | null;         // 👈 NEW
  amountPhp: number;
  method: "GCASH" | "BANK";
  status: Status;
  requestedAt: string;
  processedAt?: string | null;
  processorNote?: string | null;
  gcashNumber?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
};

type ApiResp = {
  ok: boolean;
  count: number;
  items: PayoutRequest[];
  error?: string;
};

const STATUSES: Status[] = ["PENDING", "PROCESSING", "PAID", "FAILED"];

export default function AdminPayoutsPage() {
  const [status, setStatus] = useState<Status>("PENDING");
  const [from, setFrom] = useState<string>(""); // yyyy-mm-dd
  const [to, setTo] = useState<string>("");     // yyyy-mm-dd
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<PayoutRequest[]>([]);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Details modal
  const [showDetails, setShowDetails] = useState(false);
  const [selected, setSelected] = useState<PayoutRequest | null>(null);

  const listUrl = useMemo(() => {
    const u = new URL("/api/admin/payouts/requests/list", window.location.origin);
    u.searchParams.set("status", status);
    if (from) u.searchParams.set("from", from);
    if (to) u.searchParams.set("to", to);
    return u.toString();
  }, [status, from, to]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(listUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as ApiResp;
      if (!json.ok) throw new Error(json.error || "Failed to load");
      setRows(json.items);
    } catch (e: any) {
      setErr(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listUrl]);

  async function markPaid(id: string) {
    const note = prompt("Optional note for this payout (e.g., sent via GCash, reference #):") || "";
    setMarkingId(id);
    try {
      const res = await fetch("/api/admin/payouts/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ id, note }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Mark paid failed");
      await load();
    } catch (e) {
      alert((e as any)?.message || "Mark paid failed");
    } finally {
      setMarkingId(null);
    }
  }

  async function markProcessing(id: string) {
    setProcessingId(id);
    try {
      const res = await fetch(
        "/api/admin/payouts/mark-processing?id=" + encodeURIComponent(id),
        { method: "GET", cache: "no-store" }
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Mark processing failed");
      await load();
    } catch (e) {
      alert((e as any)?.message || "Mark processing failed");
    } finally {
      setProcessingId(null);
    }
  }

  /** Export current rows to CSV */
  function exportCSV(filenamePrefix = `payouts_${status.toLowerCase()}`) {
    if (!rows.length) return alert("No data to export.");
    const header = [
      "ID",
      "UserID",
      "UserEmail",         // 👈 NEW
      "AmountPHP",
      "Method",
      "Status",
      "GCashNumber",
      "BankName",
      "BankAccountNumber",
      "RequestedAt",
      "ProcessedAt",
      "ProcessorNote",
    ];
    const csvBody = rows.map(r =>
      [
        r.id,
        r.userId,
        r.userEmail || "",
        r.amountPhp,
        r.method,
        r.status,
        r.gcashNumber || "",
        r.bankName || "",
        r.bankAccountNumber || "",
        r.requestedAt,
        r.processedAt || "",
        (r.processorNote || "").replace(/\n/g, " "),
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
    );
    const csv = [header.join(","), ...csvBody].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const daterange = (from || to) ? `_${from || "start"}_${to || "now"}` : "";
    a.href = url;
    a.download = `${filenamePrefix}${daterange}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Export all four statuses (simple: trigger 4 CSVs) */
  async function exportAllStatuses() {
    const base = new URL("/api/admin/payouts/requests/list", window.location.origin);
    if (from) base.searchParams.set("from", from);
    if (to) base.searchParams.set("to", to);

    for (const s of STATUSES) {
      const u = new URL(base.toString());
      u.searchParams.set("status", s);
      try {
        const res = await fetch(u.toString(), { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ApiResp;
        if (!json.ok) throw new Error(json.error || "Failed list");
        const header = [
          "ID","UserID","UserEmail","AmountPHP","Method","Status",
          "GCashNumber","BankName","BankAccountNumber","RequestedAt","ProcessedAt","ProcessorNote",
        ];
        const csvBody = json.items.map(r =>
          [
            r.id,
            r.userId,
            r.userEmail || "",
            r.amountPhp,
            r.method,
            r.status,
            r.gcashNumber || "",
            r.bankName || "",
            r.bankAccountNumber || "",
            r.requestedAt,
            r.processedAt || "",
            (r.processorNote || "").replace(/\n/g, " "),
          ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
        );
        const csv = [header.join(","), ...csvBody].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const daterange = (from || to) ? `_${from || "start"}_${to || "now"}` : "";
        a.href = url;
        a.download = `payouts_${s.toLowerCase()}${daterange}_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (e: any) {
        alert(`Export ${s} failed: ${e?.message || "Unknown error"}`);
      }
    }
  }

  function openDetails(r: PayoutRequest) {
    setSelected(r);
    setShowDetails(true);
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(text);
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Admin · Payout Requests</h1>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-gray-600">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase()}</option>)}
          </select>

          <label className="text-sm text-gray-600 ml-2">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />

          <label className="text-sm text-gray-600">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />

          <button
            onClick={load}
            className="border px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
            disabled={loading}
            title="Reload with filters"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>

          <button
            onClick={() => exportCSV()}
            className="border px-3 py-2 rounded-lg text-sm bg-emerald-50 hover:bg-emerald-100"
            title="Export current table"
          >
            Download CSV
          </button>

          <button
            onClick={exportAllStatuses}
            className="border px-3 py-2 rounded-lg text-sm bg-indigo-50 hover:bg-indigo-100"
            title="Download 4 CSVs for all statuses"
          >
            Download All (4 CSVs)
          </button>
        </div>
      </header>

      {err && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          {err}
        </div>
      )}

      <section className="border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Email</th>{/* NEW */}
              <th className="text-left px-4 py-3">Amount (PHP)</th>
              <th className="text-left px-4 py-3">Method</th>
              <th className="text-left px-4 py-3">Destination</th>
              <th className="text-left px-4 py-3">Requested</th>
              <th className="text-left px-4 py-3">Processed</th>
              <th className="text-left px-4 py-3">Note</th>
              <th className="text-left px-4 py-3 w-[18rem]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.userId}</td>
                  <td className="px-4 py-3">{r.userEmail || "—"}</td>
                  <td className="px-4 py-3">{r.amountPhp.toLocaleString()}</td>
                  <td className="px-4 py-3">{r.method}</td>
                  <td className="px-4 py-3">
                    {r.method === "GCASH"
                      ? r.gcashNumber || "—"
                      : r.bankName
                      ? `${r.bankName} • ${r.bankAccountNumber ?? "—"}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(r.requestedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {r.processedAt ? new Date(r.processedAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      title={r.processorNote || undefined}
                      className="block max-w-[14rem] truncate align-middle"
                    >
                      {r.processorNote?.length ? r.processorNote : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex flex-wrap items-center gap-2">
                    {/* Copy buttons */}
                    <button
                      className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                      onClick={() => copy(r.id)}
                      title="Copy Request ID"
                    >
                      Copy ID
                    </button>
                    <button
                      className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                      onClick={() => copy(r.userId)}
                      title="Copy User ID"
                    >
                      Copy User
                    </button>
                    {/* Details modal */}
                    <button
                      className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                      onClick={() => openDetails(r)}
                      title="View details"
                    >
                      Details
                    </button>

                    {/* State actions */}
                    {r.status === "PENDING" && (
                      <>
                        <button
                          className="rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                          onClick={() => markProcessing(r.id)}
                          disabled={processingId === r.id}
                          title="Mark as Processing"
                        >
                          {processingId === r.id ? "Processing…" : "Mark Processing"}
                        </button>
                        <button
                          className="rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                          onClick={() => markPaid(r.id)}
                          disabled={markingId === r.id}
                          title="Mark as Paid"
                        >
                          {markingId === r.id ? "Marking…" : "Mark Paid"}
                        </button>
                      </>
                    )}
                    {r.status === "PROCESSING" && (
                      <button
                        className="rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                        onClick={() => markPaid(r.id)}
                        disabled={markingId === r.id}
                        title="Complete → Paid"
                      >
                        {markingId === r.id ? "Marking…" : "Complete → Paid"}
                      </button>
                    )}
                    {(r.status === "PAID" || r.status === "FAILED") && (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={12}>
                  {loading ? "Loading…" : "No results"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <footer className="text-sm text-gray-600">
        Showing {rows.length} {rows.length === 1 ? "row" : "rows"} · Status: {status}
      </footer>

      {/* Details Modal */}
      {showDetails && selected && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Payout Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <Detail label="Request ID" value={selected.id} copyable />
              <Detail label="User ID" value={selected.userId} copyable />
              <Detail label="User Email" value={selected.userEmail || "—"} />
              <Detail label="Amount (PHP)" value={selected.amountPhp.toLocaleString()} />
              <Detail label="Method" value={selected.method} />
              <Detail
                label="Destination"
                value={
                  selected.method === "GCASH"
                    ? selected.gcashNumber || "—"
                    : selected.bankName
                    ? `${selected.bankName} • ${selected.bankAccountNumber ?? "—"}`
                    : "—"
                }
              />
              <Detail label="Requested" value={new Date(selected.requestedAt).toLocaleString()} />
              <Detail label="Processed" value={selected.processedAt ? new Date(selected.processedAt).toLocaleString() : "—"} />
              <div className="md:col-span-2">
                <div className="text-xs font-medium text-gray-600">Processor Note</div>
                <div className="mt-1 whitespace-pre-wrap border rounded-lg p-2">
                  {selected.processorNote?.length ? selected.processorNote : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Detail({ label, value, copyable = false }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-600">{label}</div>
      <div className="mt-0.5 flex items-center gap-2">
        <div className="font-mono text-xs break-all">{value}</div>
        {copyable && (
          <button
            className="rounded border px-2 py-0.5 text-[11px] hover:bg-gray-50"
            onClick={() => navigator.clipboard?.writeText(value)}
            title="Copy to clipboard"
          >
            Copy
          </button>
        )}
      </div>
    </div>
  );
}
