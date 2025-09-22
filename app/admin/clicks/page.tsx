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
  const offset = (page - 1) * pageSize;

  // Raw SQL to avoid Prisma type mismatches in CI/build
  const rows: any[] = await prisma.$queryRawUnsafe(
    `
    SELECT
      ce."id",
      ce."createdAt",
      ce."ip",
      ce."userAgent",
      ce."destinationUrl",
      ce."referrer",
      u."id"       AS "userId",
      u."email"    AS "userEmail",
      m."id"       AS "merchantId",
      m."merchantName" AS "merchantName"
    FROM "ClickEvent" ce
    LEFT JOIN "User" u ON u."id" = ce."userId"
    LEFT JOIN "MerchantRule" m ON m."id" = ce."merchantId"
    ORDER BY ce."createdAt" DESC
    LIMIT $1 OFFSET $2
    `,
    pageSize,
    offset
  );

  return rows.map((r) => ({
    id: String(r.id),
    createdAt:
      typeof r.createdAt === "string"
        ? r.createdAt
        : r.createdAt?.toISOString?.() ?? String(r.createdAt),
    user: r.userId ? { id: String(r.userId), email: r.userEmail ?? null } : null,
    merchant: r.merchantId
      ? { id: String(r.merchantId), merchantName: r.merchantName ?? null }
      : null,
    ip: r.ip ?? null,
    userAgent: r.userAgent ?? null,
    destinationUrl: r.destinationUrl ?? null,
    referrer: r.referrer ?? null,
  }));
}

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warn" | "danger";
}) {
  const tones: Record<string, string> = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warn: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export default async function AdminClicksPage() {
  let clicks: ClickRow[] = [];
  let error: string | null = null;

  try {
    clicks = await getClicks(1, 50);
  } catch (e) {
    console.error("admin/clicks load error:", e);
    error = "Failed to load clicks.";
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Recent Clicks</h1>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

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
            {!clicks.length && !error ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-gray-600" colSpan={7}>
                  No clicks yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
