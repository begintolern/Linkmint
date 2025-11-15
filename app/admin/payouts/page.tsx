// app/admin/payouts/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/utils/adminGuard";
import ActionsCell from "./ActionsCell";

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  // Use the same admin guard as the main /admin page
  await assertAdmin();

  const statusFilter =
    typeof searchParams?.status === "string"
      ? searchParams.status.toUpperCase()
      : "ALL";

  const where =
    statusFilter === "ALL" ? {} : { status: statusFilter as any };

  const rows = await prisma.payoutRequest.findMany({
    where,
    orderBy: { requestedAt: "desc" },
    take: 50,
    select: {
      id: true,
      user: { select: { email: true, name: true } },
      amountPhp: true,
      method: true,
      provider: true,
      status: true,
      requestedAt: true,
      processedAt: true,
      processorNote: true,
    },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Payout Requests</h1>

      <div className="flex gap-3 mb-4 text-sm">
        {["ALL", "PENDING", "PROCESSING", "PAID", "FAILED"].map((s) => (
          <a
            key={s}
            href={`/admin/payouts?status=${s}`}
            className={`px-3 py-1 border rounded ${
              statusFilter === s
                ? "bg-teal-600 text-white"
                : "hover:bg-gray-50"
            }`}
          >
            {s}
          </a>
        ))}
      </div>

      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">User / Email</th>
              <th className="px-3 py-2 text-right">Amount (PHP)</th>
              <th className="px-3 py-2 text-left">Method</th>
              <th className="px-3 py-2 text-left">Provider</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Requested At</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
                <td className="px-3 py-2">
                  {r.user?.name ? `${r.user.name} · ` : ""}
                  <span className="text-gray-600">{r.user?.email}</span>
                </td>
                <td className="px-3 py-2 text-right font-medium">
                  ₱{r.amountPhp.toLocaleString()}
                </td>
                <td className="px-3 py-2">{r.method}</td>
                <td className="px-3 py-2">{r.provider}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                      r.status === "PAID"
                        ? "bg-green-100 text-green-700"
                        : r.status === "PROCESSING"
                        ? "bg-yellow-100 text-yellow-700"
                        : r.status === "PENDING"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {r.requestedAt.toISOString().split("T")[0]}
                </td>
                <td className="px-3 py-2">
                  <ActionsCell id={r.id} status={r.status} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-10 text-center text-gray-400"
                >
                  No payout requests found for {statusFilter}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
