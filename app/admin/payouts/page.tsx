// app/admin/payouts/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";
import ApproveButton from "./ApproveButton";

type Row = {
  id: string; // payoutLog id
  createdAt: string;
  userEmail: string | null;
  receiverEmail: string | null;
  amount: number | null; // USD (float)
  status: string | null; // REQUESTED | APPROVED | PAID | FAILED
  note: string | null;
};

export default async function AdminPayoutsPage() {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.email) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { email: String(session.user.email) },
    select: { role: true },
  });
  if ((me?.role ?? "").toUpperCase() !== "ADMIN") redirect("/dashboard");

  const logs = await prisma.payoutLog.findMany({
    where: { status: { in: ["REQUESTED", "APPROVED"] } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      createdAt: true,
      amount: true,
      receiverEmail: true,
      status: true,
      note: true,
      user: { select: { email: true } },
    },
  });

  const rows: Row[] = logs.map((l) => ({
    id: l.id,
    createdAt: new Date(l.createdAt).toLocaleString(),
    userEmail: l.user?.email ?? null,
    receiverEmail: l.receiverEmail ?? null,
    amount: l.amount ?? null,
    status: l.status ?? null,
    note: l.note ?? null,
  }));

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Admin • Payout Requests</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 border">When</th>
              <th className="p-2 border">User</th>
              <th className="p-2 border">Destination</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Note</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="p-3 border text-center" colSpan={7}>
                  No requests yet
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="p-2 border">{r.createdAt}</td>
                <td className="p-2 border">{r.userEmail ?? "—"}</td>
                <td className="p-2 border">{r.receiverEmail ?? "—"}</td>
                <td className="p-2 border">{r.amount != null ? `$${r.amount.toFixed(2)}` : "—"}</td>
                <td className="p-2 border">{r.status ?? "—"}</td>
                <td className="p-2 border max-w-[240px] truncate" title={r.note ?? ""}>
                  {r.note ?? "—"}
                </td>
                <td className="p-2 border">
                  {r.status === "REQUESTED" ? (
                    <ApproveButton logId={r.id} />
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
