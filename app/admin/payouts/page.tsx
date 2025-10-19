// app/admin/payouts/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/utils/adminGuard";
import Link from "next/link";
import { format } from "date-fns";

function fmtMoney(n?: number | null) {
  if (typeof n !== "number") return "-";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function badge(c: string, text: string) {
  const cls =
    c === "green"
      ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
      : c === "amber"
      ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
      : c === "red"
      ? "bg-rose-100 text-rose-700 ring-1 ring-rose-200"
      : "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {text}
    </span>
  );
}

export default async function AdminPayoutsPage() {
  await assertAdmin();

  // Optional simple filter by status via ?status=PAID|PENDING|FAILED
  // (works with either status (string) or statusEnum if present)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const url = require("next/headers").headers(); // safe for server; just to avoid searchParams boilerplate
  const statusParam = (url.get("x-next-url") ?? "").includes("?status=")
    ? decodeURIComponent((url.get("x-next-url")!.split("?status=")[1] || "").split("&")[0])
    : null;

  const where: any = {};
  if (statusParam) {
    // Try both fields; your model has status (string) and statusEnum (enum)
    where.OR = [{ status: statusParam }, { statusEnum: statusParam }];
  }

  const payouts = await prisma.payout.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      userId: true,
      amount: true,
      method: true,
      status: true,
      statusEnum: true,
      details: true,
      provider: true,
      receiverEmail: true,
      createdAt: true,
      paidAt: true,
      user: { select: { email: true, name: true } },
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Payouts</h1>
          <p className="text-sm text-slate-600 mt-1">
            Latest {payouts.length} payouts. Filter with <code>?status=PAID</code>, <code>?status=PENDING</code>, etc.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50"
        >
          Back to Admin
        </Link>
      </header>

      <div className="mt-6 overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr className="text-slate-600">
              <th className="px-3 py-2 font-medium">Created</th>
              <th className="px-3 py-2 font-medium">User</th>
              <th className="px-3 py-2 font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Method</th>
              <th className="px-3 py-2 font-medium">Provider</th>
              <th className="px-3 py-2 font-medium">Receiver</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Paid At</th>
              <th className="px-3 py-2 font-medium">Details</th>
              <th className="px-3 py-2 font-medium">ID</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {payouts.map((p) => {
              const s = (p.statusEnum as any) ?? p.status ?? "UNKNOWN";
              const pill =
                s === "PAID" || s === "SUCCESS"
                  ? badge("green", String(s))
                  : s === "PENDING" || s === "QUEUED" || s === "READY"
                  ? badge("amber", String(s))
                  : s === "FAILED" || s === "CANCELED"
                  ? badge("red", String(s))
                  : badge("gray", String(s));

              return (
                <tr key={p.id} className="align-top">
                  <td className="px-3 py-2 text-slate-700">
                    {format(new Date(p.createdAt), "yyyy-MM-dd HH:mm")}
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-slate-900 font-medium">
                      {p.user?.name || p.user?.email || p.userId}
                    </div>
                    <div className="text-slate-500 text-xs">
                      {p.user?.email ? p.user.email : p.userId}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-900">{fmtMoney(p.amount)}</td>
                  <td className="px-3 py-2 text-slate-700">{p.method ?? "-"}</td>
                  <td className="px-3 py-2 text-slate-700">{p.provider ?? "-"}</td>
                  <td className="px-3 py-2 text-slate-700">{p.receiverEmail ?? "-"}</td>
                  <td className="px-3 py-2">{pill}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {p.paidAt ? format(new Date(p.paidAt), "yyyy-MM-dd HH:mm") : "-"}
                  </td>
                  <td className="px-3 py-2 text-slate-700 whitespace-pre-wrap">
                    {p.details ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-slate-500 text-xs">{p.id}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-slate-500">
        Tip: append <code>?status=PAID</code> or <code>?status=PENDING</code> to this URL to filter.
      </div>
    </main>
  );
}
