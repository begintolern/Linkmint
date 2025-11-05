"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { useEffect, useMemo, useState } from "react";

type Payout = {
  id: string;
  userId: string;
  userEmail?: string;
  amountPhp: number;
  method: string;
  status: "PENDING" | "PROCESSING" | "PAID" | string;
  requestedAt: string;
  processedAt?: string;
  gcashNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  processorNote?: string;
};

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "PROCESSING" | "PAID">("ALL");
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [csvDownloading, setCsvDownloading] = useState(false);
  const [selected, setSelected] = useState<Payout | null>(null);

  // Build the list API URL (relative, SSR-safe)
  const listUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (dateRange.from) params.set("from", dateRange.from);
    if (dateRange.to) params.set("to", dateRange.to);
    const qs = params.toString();
    return `/api/admin/payouts/requests/list${qs ? `?${qs}` : ""}`;
  }, [statusFilter, dateRange]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(listUrl, { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && data?.ok && Array.isArray(data.items)) {
          setPayouts(data.items as Payout[]);
        }
      } catch (err) {
        console.error("Failed to load payouts", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [listUrl]);

  async function markPaid(id: string) {
    if (!window.confirm("Mark this payout as PAID?")) return;
    const res = await fetch("/api/admin/payouts/mark-paid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data?.ok) {
      setPayouts((prev) => prev.map((p) => (p.id === id ? { ...p, status: "PAID", processedAt: new Date().toISOString() } : p)));
    } else {
      alert("Failed: " + (data?.error || "Unknown error"));
    }
  }

  async function markProcessing(id: string) {
    const res = await fetch("/api/admin/payouts/mark-processing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data?.ok) {
      setPayouts((prev) => prev.map((p) => (p.id === id ? { ...p, status: "PROCESSING" } : p)));
    } else {
      alert("Failed: " + (data?.error || "Unknown error"));
    }
  }

  async function exportCsv() {
    setCsvDownloading(true);
    try {
      const res = await fetch(listUrl + (listUrl.includes("?") ? "&" : "?") + "format=csv", { cache: "no-store" });
      if (!res.ok) throw new Error("CSV request failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "payouts.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export failed", err);
      alert("CSV export failed.");
    } finally {
      setCsvDownloading(false);
    }
  }

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleString(undefined, { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-";

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Admin Payouts</h1>
        <button
          onClick={exportCsv}
          disabled={csvDownloading}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {csvDownloading ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(["ALL", "PENDING", "PROCESSING", "PAID"] as const).map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`rounded-lg border px-3 py-1 text-sm ${
              statusFilter === st ? "bg-black text-white border-black" : "hover:bg-gray-50"
            }`}
            aria-pressed={statusFilter === st}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={dateRange.from}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateRange((r) => ({ ...r, from: e.target.value }))}
          className="rounded-lg border px-3 py-2 text-sm"
          aria-label="From date"
        />
        <span>to</span>
        <input
          type="date"
          value={dateRange.to}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateRange((r) => ({ ...r, to: e.target.value }))}
          className="rounded-lg border px-3 py-2 text-sm"
          aria-label="To date"
        />
        <button
          onClick={() => setDateRange({ from: "", to: "" })}
          className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">User Email</th>
              <th className="px-3 py-2 text-left">Amount (₱)</th>
              <th className="px-3 py-2 text-left">Method</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Requested</th>
              <th className="px-3 py-2 text-left">Processed</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-4 text-center">
                  Loading…
                </td>
              </tr>
            ) : payouts.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  No payouts found.
                </td>
              </tr>
            ) : (
              payouts.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2">{p.userEmail || p.userId}</td>
                  <td className="px-3 py-2">₱{p.amountPhp}</td>
                  <td className="px-3 py-2">{p.method}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.status === "PAID"
                          ? "bg-green-100 text-green-700"
                          : p.status === "PROCESSING"
                          ? "bg-yellow-100 text-yellow-700"
                          : p.status === "PENDING"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">{fmt(p.requestedAt)}</td>
                  <td className="px-3 py-2">{fmt(p.processedAt)}</td>
                  <td className="px-3 py-2 space-x-2">
                    {p.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => markProcessing(p.id)}
                          className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50"
                        >
                          Mark Processing
                        </button>
                        <button
                          onClick={() => markPaid(p.id)}
                          className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50"
                        >
                          Mark Paid
                        </button>
                      </>
                    )}
                    {p.status === "PROCESSING" && (
                      <button
                        onClick={() => markPaid(p.id)}
                        className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50"
                      >
                        Complete Paid
                      </button>
                    )}
                    {p.status === "PAID" && (
                      <button
                        onClick={() => setSelected(p)}
                        className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50"
                      >
                        Details
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-3 text-lg font-semibold">Payout Details</h2>
            <div className="space-y-1 text-sm">
              <p>
                <strong>User:</strong> {selected.userEmail || selected.userId}
              </p>
              <p>
                <strong>Amount:</strong> ₱{selected.amountPhp}
              </p>
              <p>
                <strong>Method:</strong> {selected.method}
              </p>
              {selected.gcashNumber && (
                <p>
                  <strong>GCash:</strong> {selected.gcashNumber}
                </p>
              )}
              {selected.bankName && (
                <p>
                  <strong>Bank:</strong> {selected.bankName} ({selected.bankAccountNumber || "—"})
                </p>
              )}
              {selected.processorNote && (
                <p>
                  <strong>Note:</strong> {selected.processorNote}
                </p>
              )}
              <p>
                <strong>Requested:</strong> {fmt(selected.requestedAt)}
              </p>
              <p>
                <strong>Processed:</strong> {fmt(selected.processedAt)}
              </p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setSelected(null)}
                className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
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
