// app/admin/payouts/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import Link from "next/link";
import SendButton from "./SendButton";

function fmtUSD(cents: number | null | undefined) {
  const v = (Number(cents || 0) / 100).toFixed(2);
  return `$${v}`;
}

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default async function AdminPayoutsPage() {
  // Admin-gate this page
  await requireAdmin();

  // Load recent payouts (show PENDING first, then others)
  const rows = await prisma.payout.findMany({
    orderBy: [{ statusEnum: "asc" }, { createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      createdAt: true,
      userId: true,
      provider: true,
      receiverEmail: true,
      amount: true,     // optional float column
      netCents: true,   // int cents actually sent
      statusEnum: true,
      user: { select: { email: true } },
    },
  });

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin · Payouts</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/admin" className="underline text-gray-600">
            Back to Admin
          </Link>
          {/* NEW: quick link to payout logs */}
          <Link href="/admin/logs" className="underline text-gray-600">
            Logs
          </Link>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        Review payout requests. Amount sent uses <code>netCents</code>. Only admins can access this page.
      </p>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Created</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">User</th>
              <th className="px-3 py-2 text-left">Provider</th>
              <th className="px-3 py-2 text-left">Destination</th>
              <th className="px-3 py-2 text-right">Gross (amount)</th>
              <th className="px-3 py-2 text-right">Net (sent)</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const gross = Number(r.amount ?? (r.netCents ?? 0) / 100);
              const netUsd = Number(r.netCents ?? 0) / 100;
              const canSend =
                r.statusEnum === "PENDING" &&
                r.provider === "PAYPAL" &&
                !!r.receiverEmail &&
                netUsd > 0;

              return (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">{fmtDate(r.createdAt)}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border">
                      {r.statusEnum}
                    </span>
                  </td>
                  <td className="px-3 py-2">{r.user?.email ?? r.userId}</td>
                  <td className="px-3 py-2">{r.provider}</td>
                  <td className="px-3 py-2">{r.receiverEmail ?? "-"}</td>
                  <td className="px-3 py-2 text-right">${gross.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{fmtUSD(r.netCents)}</td>
                  <td className="px-3 py-2 text-right">
                    {canSend ? (
                      <SendButton
                        payoutId={r.id}
                        amountUSD={netUsd}
                        receiverEmail={r.receiverEmail}
                      />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={8}>
                  No payouts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
