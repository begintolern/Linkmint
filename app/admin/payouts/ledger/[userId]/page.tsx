// app/admin/payouts/ledger/[userId]/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { prisma } from "@/lib/db";

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

export default async function UserLedgerPage({
  params,
  searchParams,
}: {
  params: { userId: string };
  searchParams?: { status?: "ALL" | "PENDING" | "PROCESSING" | "PAID" | "FAILED" };
}) {
  const userId = params.userId;
  const status = (searchParams?.status || "ALL") as "ALL" | "PENDING" | "PROCESSING" | "PAID" | "FAILED";

  const where: any = { userId };
  if (status !== "ALL") where.status = status;

  const [user, totals, byStatus, rows] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } }),
    prisma.payoutRequest.aggregate({
      where,
      _count: { _all: true },
      _sum: { amountPhp: true },
      _min: { requestedAt: true },
      _max: { processedAt: true },
    }),
    prisma.payoutRequest.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
      _sum: { amountPhp: true },
    }),
    prisma.payoutRequest.findMany({
      where,
      orderBy: [{ requestedAt: "desc" }],
      take: 500,
      select: {
        id: true,
        amountPhp: true,
        method: true,
        provider: true,
        status: true,
        requestedAt: true,
        processedAt: true,
        processorNote: true,
        gcashNumber: true,
        bankName: true,
        bankAccountNumber: true,
      },
    }),
  ]);

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-xl font-semibold">User Ledger</h1>
          <p className="mt-2 text-sm text-red-600">User not found.</p>
        </div>
      </main>
    );
  }

  const byStatusMap = new Map(byStatus.map((g) => [g.status, { count: g._count._all, sum: g._sum.amountPhp ?? 0 }]));

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Header with Back + Export CSV */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Payout Ledger</h1>
          <div className="flex items-center gap-2">
            <a href="/admin/payouts" className="rounded-md border px-3 py-1 text-sm hover:bg-gray-100">
              ← Back to Payouts
            </a>
            <a
              href={`/admin/payouts/ledger/${userId}/csv`}
              className="rounded-md border px-3 py-1 text-sm hover:bg-gray-100"
              title="Download this user's payout ledger as CSV"
            >
              Export CSV
            </a>
          </div>
        </div>

        {/* User header */}
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">User</div>
          <div className="text-lg font-medium">{user.email || user.id}</div>
          {user.name ? <div className="text-sm text-gray-500">{user.name}</div> : null}
        </div>

        {/* Filters */}
        <div className="rounded-xl border bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {(["ALL", "PENDING", "PROCESSING", "PAID", "FAILED"] as const).map((s) => (
              <a
                key={s}
                href={`/admin/payouts/ledger/${userId}?status=${s}`}
                className={`rounded-md border px-3 py-1 ${
                  status === s ? "bg-black text-white border-black" : "hover:bg-gray-100"
                }`}
              >
                {s}
              </a>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="text-xs text-gray-500">Total Requests</div>
            <div className="text-xl font-semibold">{totals._count._all}</div>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="text-xs text-gray-500">Total Amount (PHP)</div>
            <div className="text-xl font-semibold">₱{totals._sum.amountPhp ?? 0}</div>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="text-xs text-gray-500">First / Last</div>
            <div className="text-sm">
              <div>First: {fmt(totals._min.requestedAt?.toISOString?.() ?? (totals._min.requestedAt as any))}</div>
              <div>Last: {fmt(totals._max.processedAt?.toISOString?.() ?? (totals._max.processedAt as any))}</div>
            </div>
          </div>
        </div>

        {/* By status */}
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm font-medium mb-2">By Status</div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {(["PENDING", "PROCESSING", "PAID", "FAILED"] as const).map((s) => {
              const g = byStatusMap.get(s) || { count: 0, sum: 0 };
              return (
                <div key={s} className="rounded-lg border p-3">
                  <div className="text-xs text-gray-500">{s}</div>
                  <div className="text-lg font-semibold">{g.count}</div>
                  <div className="text-xs text-gray-500">₱{g.sum}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rows */}
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-gray-500">
                    No payout requests found for this user.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">
                      <div className="flex flex-col text-xs">
                        <span>Req: {fmt(r.requestedAt?.toISOString?.() ?? (r.requestedAt as any))}</span>
                        <span>Proc: {fmt(r.processedAt?.toISOString?.() ?? (r.processedAt as any))}</span>
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
      </div>
    </main>
  );
}
