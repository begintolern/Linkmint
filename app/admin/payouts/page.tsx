// app/admin/payouts/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import React from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

type Row = {
  id: string;
  userId: string;
  amountPhp: number;
  method: string;
  provider: string;
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED" | string;
  requestedAt?: string | null;
  processedAt?: string | null;
  processorNote?: string | null;
  gcashNumber?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  user?: { email?: string | null };
};

async function listPayoutRequests(status?: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
  const url = new URL("/api/admin/payout-requests/list", base);
  url.searchParams.set("take", "100");
  if (status) url.searchParams.set("status", status);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "x-admin-key": process.env.ADMIN_API_KEY || "" },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`List failed (${res.status})`);
  const data = (await res.json()) as { ok: boolean; total: number; rows: Row[] };
  if (!data?.ok) throw new Error("List response not ok");
  return data;
}

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams?: { status?: string; batch?: string; paid?: string };
}) {
  const status = searchParams?.status;
  const createdBatchId = searchParams?.batch;
  const paidBatchId = searchParams?.paid;
  const data = await listPayoutRequests(status);
  const rows = data.rows || [];

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Payout Requests</h1>
          <div className="flex items-center gap-2 text-sm">
            {["ALL", "PENDING", "PROCESSING", "PAID", "FAILED"].map((s) => (
              <a
                key={s}
                href={s === "ALL" ? "/admin/payouts" : `/admin/payouts?status=${s}`}
                className={`rounded-md border px-3 py-1 ${
                  status === s || (!status && s === "ALL")
                    ? "bg-black text-white border-black"
                    : "hover:bg-gray-100"
                }`}
              >
                {s}
              </a>
            ))}
          </div>
        </div>

        {createdBatchId && (
          <div className="mb-3 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800">
            Manual batch created: <span className="font-mono">{createdBatchId}</span>
          </div>
        )}
        {paidBatchId && (
          <div className="mb-3 rounded-md border border-blue-300 bg-blue-50 p-3 text-sm text-blue-800">
            Batch marked PAID: <span className="font-mono">{paidBatchId}</span>
          </div>
        )}

        <div className="text-sm text-gray-600 mb-3">
          Total: {data?.total ?? 0} • Showing {rows.length}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">User / Email</th>
                <th className="px-3 py-2 text-left">Amount (₱)</th>
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-left">Provider</th>
                <th className="px-3 py-2 text-left">Requested / Processed</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-4 text-gray-500 text-center">
                    No payout requests found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-mono text-[12px]">{r.id}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{r.user?.email || r.userId}</div>
                      <div className="text-xs text-gray-500">{r.userId}</div>
                    </td>
                    <td className="px-3 py-2">₱{r.amountPhp}</td>
                    <td className="px-3 py-2">{r.method}</td>
                    <td className="px-3 py-2">{r.provider}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col text-xs">
                        <span>Req: {fmt(r.requestedAt)}</span>
                        <span>Proc: {fmt(r.processedAt)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-gray-500">—</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
