// app/dashboard/payouts/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import React from "react";

type SummaryResp = {
  ok: boolean;
  user?: { id: string; email: string | null };
  summary?: {
    PENDING: { count: number; amountPhp: number };
    PROCESSING: { count: number; amountPhp: number };
    PAID: { count: number; amountPhp: number };
    FAILED: { count: number; amountPhp: number };
  };
  totals?: { requests: number; amountPhp: number };
  recent?: Array<{
    id: string;
    amountPhp: number;
    method: string;
    provider: string;
    status: string;
    requestedAt: string;
    processedAt?: string | null;
    processorNote?: string | null;
  }>;
  error?: string;
};

function fmt(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso ?? "—";
  }
}

async function loadSummary(): Promise<SummaryResp> {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
  const res = await fetch(`${base}/api/user/payouts/summary`, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (res.status === 401) {
    const allowDev =
      process.env.ALLOW_DEV_PAYOUTS_REQUEST === "1" ||
      process.env.ALLOW_DEV_PAYOUTS_REQUEST_BYPASS === "1";
    const devId = process.env.DEV_USER_ID;
    if (allowDev && devId) {
      const devRes = await fetch(
        `${base}/api/user/payouts/summary?devUserId=${encodeURIComponent(devId)}`,
        { cache: "no-store" }
      );
      if (!devRes.ok) {
        const text = await devRes.text().catch(() => "");
        return { ok: false, error: `Dev-bypass failed (${devRes.status}): ${text}` };
      }
      return (await devRes.json()) as SummaryResp;
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, error: `Fetch failed (${res.status}): ${text}` };
  }
  return (await res.json()) as SummaryResp;
}

export default async function PayoutsSummaryPage() {
  const data = await loadSummary();

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Your Payouts</h1>
          <a
            href="/dashboard"
            className="rounded-md border px-3 py-1 text-sm hover:bg-gray-100"
          >
            ← Back to Dashboard
          </a>
        </div>

        {!data.ok ? (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-800">
            <div className="font-medium mb-1">Unable to load payouts.</div>
            <div className="text-sm">
              {data.error || "Please log in and try again."}
            </div>
          </div>
        ) : (
          <>
            {/* User header */}
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="text-xs text-gray-500">Signed in as</div>
              <div className="text-lg font-medium">
                {data.user?.email || data.user?.id}
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {(["PENDING", "PROCESSING", "PAID", "FAILED"] as const).map((k) => {
                const s = data.summary?.[k] || { count: 0, amountPhp: 0 };
                return (
                  <div key={k} className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-500">{k}</div>
                    <div className="text-xl font-semibold">{s.count}</div>
                    <div className="text-xs text-gray-500">₱{s.amountPhp}</div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="text-sm text-gray-600">
                Total requests: <strong>{data.totals?.requests ?? 0}</strong> • Total amount:{" "}
                <strong>₱{data.totals?.amountPhp ?? 0}</strong>
              </div>
            </div>

            {/* Recent */}
            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Requested / Processed</th>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">Amount (₱)</th>
                    <th className="px-3 py-2 text-left">Method</th>
                    <th className="px-3 py-2 text-left">Provider</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.recent || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-4 text-center text-gray-500">
                        No payout requests yet.
                      </td>
                    </tr>
                  ) : (
                    (data.recent || []).map((r) => (
                      <tr key={r.id} className="border-t border-gray-100">
                        <td className="px-3 py-2">
                          <div className="flex flex-col text-xs">
                            <span>Req: {fmt(r.requestedAt)}</span>
                            <span>Proc: {fmt(r.processedAt)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 font-mono text-[12px]">{r.id}</td>
                        <td className="px-3 py-2">₱{r.amountPhp}</td>
                        <td className="px-3 py-2">{r.method}</td>
                        <td className="px-3 py-2">{r.provider}</td>
                        <td className="px-3 py-2">{r.status}</td>
                        <td className="px-3 py-2">{r.processorNote || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* CTA row */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/dashboard/earnings"
                className="rounded-md border px-3 py-2 text-sm hover:bg-gray-100"
                title="View commission earnings"
              >
                View Earnings
              </a>
              <a
                href="/dashboard/payouts/request"
                className="rounded-md border px-3 py-2 text-sm hover:bg-gray-100"
                title="Request a payout"
              >
                Request Payout
              </a>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
