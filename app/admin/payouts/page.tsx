// app/admin/payouts/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import React from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/** ---- Helpers ---- */
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

async function listPayoutRequests(status?: "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "ALL") {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
  const url = new URL("/api/admin/payout-requests/list", base);
  url.searchParams.set("take", "100");
  if (status && status !== "ALL") url.searchParams.set("status", status);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "x-admin-key": process.env.ADMIN_API_KEY || "" },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`List failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { ok: boolean; total: number; rows: Row[] };
  if (!data?.ok) throw new Error("List response not ok");
  return data;
}

/** ---- Server actions ---- */
async function approveAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  const note = String(formData.get("note") || "Approved");
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";

  const res = await fetch(`${base}/api/admin/payout-requests/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": process.env.ADMIN_API_KEY || "",
    },
    body: JSON.stringify({ id, note }),
    cache: "no-store",
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Approve failed (${res.status}): ${t}`);
  }

  revalidatePath("/admin/payouts");
}

async function denyAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  const note = String(formData.get("note") || "Denied");
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";

  const res = await fetch(`${base}/api/admin/payout-requests/deny`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": process.env.ADMIN_API_KEY || "",
    },
    body: JSON.stringify({ id, note }),
    cache: "no-store",
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Deny failed (${res.status}): ${t}`);
  }

  revalidatePath("/admin/payouts");
}

/** Create a manual batch for all current PROCESSING payout requests */
async function createBatchForProcessing() {
  "use server";
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
  const adminKey = process.env.ADMIN_API_KEY || "";

  // 1) Load PROCESSING requests
  const listUrl = new URL("/api/admin/payout-requests/list", base);
  listUrl.searchParams.set("status", "PROCESSING");
  listUrl.searchParams.set("take", "200");
  const listRes = await fetch(listUrl.toString(), {
    method: "GET",
    headers: { "x-admin-key": adminKey },
    cache: "no-store",
  });
  if (!listRes.ok) {
    const t = await listRes.text().catch(() => "");
    throw new Error(`Fetch PROCESSING list failed (${listRes.status}): ${t}`);
  }
  const listJson = (await listRes.json()) as { ok: boolean; rows: Row[] };
  if (!listJson?.ok) throw new Error("PROCESSING list not ok");

  const ids = (listJson.rows || []).map((r) => r.id);
  if (ids.length === 0) {
    revalidatePath("/admin/payouts");
    return;
  }

  // 2) Create batch
  const createRes = await fetch(`${base}/api/admin/payouts/batch/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey,
    },
    body: JSON.stringify({
      ids,
      note: "Manual batch from admin page",
    }),
    cache: "no-store",
  });

  if (!createRes.ok) {
    const t = await createRes.text().catch(() => "");
    throw new Error(`Batch create failed (${createRes.status}): ${t}`);
  }
  const createJson = (await createRes.json()) as { ok: boolean; batchId?: string };
  const batchId = createJson?.batchId || "";

  redirect(`/admin/payouts?batch=${encodeURIComponent(batchId)}`);
}

/** Mark a given batch PAID, mapping all current PROCESSING requests */
async function markBatchPaidAction(formData: FormData) {
  "use server";
  const batchId = String(formData.get("batchId") || "");
  if (!batchId) throw new Error("Missing batchId");
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
  const adminKey = process.env.ADMIN_API_KEY || "";

  // Collect all PROCESSING requests (assumes they’re the ones just batched)
  const listUrl = new URL("/api/admin/payout-requests/list", base);
  listUrl.searchParams.set("status", "PROCESSING");
  listUrl.searchParams.set("take", "500");
  const listRes = await fetch(listUrl.toString(), {
    method: "GET",
    headers: { "x-admin-key": adminKey },
    cache: "no-store",
  });
  if (!listRes.ok) {
    const t = await listRes.text().catch(() => "");
    throw new Error(`Fetch PROCESSING list failed (${listRes.status}): ${t}`);
  }
  const listJson = (await listRes.json()) as { ok: boolean; rows: Row[] };
  if (!listJson?.ok) throw new Error("PROCESSING list not ok");

  const requestIds = (listJson.rows || []).map((r) => r.id);
  if (requestIds.length === 0) {
    revalidatePath("/admin/payouts");
    return;
  }

  // Mark batch paid
  const paidRes = await fetch(`${base}/api/admin/payouts/batch/mark-paid`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey,
    },
    body: JSON.stringify({
      batchId,
      requestIds,
      note: "Paid via admin page",
    }),
    cache: "no-store",
  });

  if (!paidRes.ok) {
    const t = await paidRes.text().catch(() => "");
    throw new Error(`Mark-paid failed (${paidRes.status}): ${t}`);
  }

  redirect(`/admin/payouts?paid=${encodeURIComponent(batchId)}`);
}

/** ---- Page ---- */
export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams?: { status?: "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "ALL"; batch?: string; paid?: string };
}) {
  const status = searchParams?.status || "ALL";
  const createdBatchId = searchParams?.batch;
  const paidBatchId = searchParams?.paid;
  const data = await listPayoutRequests(status);
  const rows = data.rows || [];

  // CSV href builder honoring current status
  const csvHref =
    status && status !== "ALL" ? `/admin/payouts/csv?status=${encodeURIComponent(status)}` : "/admin/payouts/csv";

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Payout Requests</h1>
          <div className="flex items-center gap-2 text-sm">
            {(["ALL", "PENDING", "PROCESSING", "PAID", "FAILED"] as const).map((s) => (
              <a
                key={s}
                href={s === "ALL" ? "/admin/payouts" : `/admin/payouts?status=${s}`}
                className={`rounded-md border px-3 py-1 ${
                  status === s || (!searchParams?.status && s === "ALL")
                    ? "bg-black text-white border-black"
                    : "hover:bg-gray-100"
                }`}
              >
                {s}
              </a>
            ))}
            {/* Export CSV for current status */}
            <a
              href={csvHref}
              className="rounded-md border px-3 py-1 hover:bg-gray-100"
              title="Export current list as CSV"
            >
              Export CSV
            </a>
          </div>
        </div>

        {/* Success banners */}
        {createdBatchId ? (
          <div className="mb-3 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800">
            Manual batch created: <span className="font-mono">{createdBatchId}</span>
          </div>
        ) : null}
        {paidBatchId ? (
          <div className="mb-3 rounded-md border border-blue-300 bg-blue-50 p-3 text-sm text-blue-800">
            Batch marked PAID: <span className="font-mono">{paidBatchId}</span>
          </div>
        ) : null}

        {/* Batch controls */}
        <div className="mb-4 flex items-center gap-2">
          <form action={createBatchForProcessing}>
            <button
              className="rounded-md border px-4 py-2 text-sm hover:bg-gray-100"
              title="Create a single manual batch for all currently PROCESSING payout requests"
            >
              Create Manual Batch (PROCESSING)
            </button>
          </form>

          {createdBatchId ? (
            <form action={markBatchPaidAction}>
              <input type="hidden" name="batchId" value={createdBatchId} />
              <button
                className="rounded-md border px-4 py-2 text-sm hover:bg-gray-100"
                title="Mark this batch as PAID and close all PROCESSING payout requests"
              >
                Mark This Batch Paid
              </button>
            </form>
          ) : null}
        </div>

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

                    {/* ---- ACTIONS ---- */}
                    <td className="px-3 py-2">
                      {r.status !== "PAID" ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Mark Processing */}
                          <form action={approveAction}>
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="note" value="Approved for batch." />
                            <button
                              className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50"
                              formAction={approveAction}
                            >
                              Mark Processing
                            </button>
                          </form>

                          {/* Deny */}
                          <form action={denyAction}>
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="note" value="Denied by admin." />
                            <button
                              className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50"
                              formAction={denyAction}
                            >
                              Deny
                            </button>
                          </form>

                          {/* Ledger link */}
                          <a
                            href={`/admin/payouts/ledger/${r.userId}`}
                            className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50"
                            title="Open per-user payout ledger"
                          >
                            Ledger
                          </a>
                        </div>
                      ) : (
                        <a
                          href={`/admin/payouts/ledger/${r.userId}`}
                          className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50"
                          title="Open per-user payout ledger"
                        >
                          Ledger
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Secure: Admin API key is only sent from the server via server actions.
        </p>
      </div>
    </main>
  );
}
