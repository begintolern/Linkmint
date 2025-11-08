// app/admin/payouts/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "no-store";
export const revalidate = 0;

import React from "react";
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

function daysSince(iso?: string | null) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
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
  user?: { email?: string | null; createdAt?: string | null };
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

/** -------- Server actions (secure admin calls) -------- */
async function markProcessingAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) return;

  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
  await fetch(`${base}/api/admin/payout-requests/mark-processing`, {
    method: "POST",
    headers: {
      "x-admin-key": process.env.ADMIN_API_KEY || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, note: "Marked PROCESSING via admin page" }),
    cache: "no-store",
  }).catch(() => {});

  // Auto-jump to PROCESSING tab with flash
  redirect("/admin/payouts?status=PROCESSING&flash=processing");
}

async function denyAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) return;

  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
  await fetch(`${base}/api/admin/payout-requests/deny`, {
    method: "POST",
    headers: {
      "x-admin-key": process.env.ADMIN_API_KEY || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, note: "Denied via admin page" }),
    cache: "no-store",
  }).catch(() => {});

  // Auto-jump to FAILED tab with flash
  redirect("/admin/payouts?status=FAILED&flash=denied");
}

async function markPaidAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) return;

  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
  await fetch(`${base}/api/admin/payout-requests/mark-paid`, {
    method: "POST",
    headers: {
      "x-admin-key": process.env.ADMIN_API_KEY || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, note: "Marked PAID via admin page" }),
    cache: "no-store",
  }).catch(() => {});

  // Auto-jump to PAID tab with flash
  redirect("/admin/payouts?status=PAID&flash=paid");
}

/** ---- Page ---- */
export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams?: { status?: string; batch?: string; paid?: string; flash?: string };
}) {
  const status = searchParams?.status;
  const createdBatchId = searchParams?.batch;
  const paidBatchId = searchParams?.paid;
  const flash = searchParams?.flash;

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

        {/* Banners */}
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
        {flash === "processing" && (
          <div className="mb-3 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
            Request marked <strong>PROCESSING</strong>.
          </div>
        )}
        {flash === "denied" && (
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            Request <strong>DENIED</strong>.
          </div>
        )}
        {flash === "paid" && (
          <div className="mb-3 rounded-md border border-blue-300 bg-blue-50 p-3 text-sm text-blue-800">
            Request marked <strong>PAID</strong>.
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
                rows.map((r) => {
                  const d = daysSince(r.user?.createdAt);
                  const honeymoon = typeof d === "number" ? d < 30 : false;
                  const badge =
                    d == null ? (
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] text-gray-600">
                        unknown age
                      </span>
                    ) : honeymoon ? (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 text-[10px] font-semibold">
                        New User (Honeymoon · {d}d)
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-[10px] font-semibold">
                        Eligible ({d}d)
                      </span>
                    );

                  return (
                    <tr key={r.id} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-mono text-[12px]">{r.id}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{r.user?.email || r.userId}</div>
                            <div className="text-xs text-gray-500">{r.userId}</div>
                          </div>
                          {badge}
                        </div>
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
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={`/admin/payouts/ledger/${r.userId}`}
                            className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                            title="Open user payout ledger"
                          >
                            Ledger
                          </a>

                          {/* Mark Processing */}
                          {r.status === "PENDING" && (
                            <form action={markProcessingAction}>
                              <input type="hidden" name="id" value={r.id} />
                              <button
                                type="submit"
                                className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                                title="Mark as Processing"
                              >
                                Mark Processing
                              </button>
                            </form>
                          )}

                          {/* Mark Paid */}
                          {r.status === "PROCESSING" && (
                            <form action={markPaidAction}>
                              <input type="hidden" name="id" value={r.id} />
                              <button
                                type="submit"
                                className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                                title="Mark as Paid"
                              >
                                Mark Paid
                              </button>
                            </form>
                          )}

                          {/* Deny */}
                          {(r.status === "PENDING" || r.status === "PROCESSING") && (
                            <form action={denyAction} className="inline">
                              <input type="hidden" name="id" value={r.id} />
                              <button
                                type="submit"
                                className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                                title="Deny request"
                              >
                                Deny
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
