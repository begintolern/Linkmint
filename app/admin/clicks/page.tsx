// app/admin/clicks/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/db";

type ClickRow = {
  id: string;
  createdAt: string;
  user?: { id: string; email: string | null } | null;
  merchant?: { id: string; merchantName: string | null } | null;
  ip?: string | null;
  userAgent?: string | null;
  destinationUrl?: string | null;
  referrer?: string | null;
};

async function getClicks(page = 1, pageSize = 50): Promise<ClickRow[]> {
  const skip = (page - 1) * pageSize;

  // Cast the model call to any to avoid Prisma Client drift
  const rows = await (prisma as any).clickEvent.findMany({
    skip,
    take: pageSize,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true } },
      merchant: { select: { id: true, merchantName: true } },
    },
  });

  return rows.map((r: any) => ({
    id: r.id,
    createdAt: r.createdAt?.toISOString?.() ?? String(r.createdAt),
    user: r.user ? { id: r.user.id, email: r.user.email ?? null } : null,
    merchant: r.merchant
      ? { id: r.merchant.id, merchantName: r.merchant.merchantName ?? null }
      : null,
    ip: r.ip ?? null,
    userAgent: r.userAgent ?? null,
    destinationUrl: r.destinationUrl ?? null,
    referrer: r.referrer ?? null,
  }));
}

export default async function AdminClicksPage() {
  const clicks = await getClicks(1, 50);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Recent Clicks</h1>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Merchant</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3">Referrer</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">UA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {clicks.map((c) => (
              <tr key={c.id} className="align-top">
                <td className="px-4 py-3 whitespace-nowrap">
                  {new Date(c.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {c.user ? `${c.user.email ?? c.user.id}` : "—"}
                </td>
                <td className="px-4 py-3">
                  {c.merchant ? c.merchant.merchantName ?? c.merchant.id : "—"}
                </td>
                <td className="px-4 py-3 max-w-xs truncate">
                  {c.destinationUrl ?? "—"}
                </td>
                <td className="px-4 py-3 max-w-xs truncate">
                  {c.referrer ?? "—"}
                </td>
                <td className="px-4 py-3">{c.ip ?? "—"}</td>
                <td className="px-4 py-3 max-w-xs truncate">
                  {c.userAgent ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
