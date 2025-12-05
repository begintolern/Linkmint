export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function AdminActivityPage() {
  // Recent SmartLinks with click counts
  const links = await prisma.smartLink.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      _count: {
        select: { clicks: true },
      },
    },
  });

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Activity</h1>
        <Link
          href="/admin"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Admin
        </Link>
      </div>

      <p className="text-sm text-gray-600">
        Showing the 50 most recent SmartLinks created, with click counts. This
        is Activity v1 — we can later add referrals, payouts, and alerts.
      </p>

      {!links.length && (
        <div className="text-sm text-gray-500">
          No SmartLinks found yet.
        </div>
      )}

      {!!links.length && (
        <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Created
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Merchant
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Short URL
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Clicks
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Label
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {links.map((link: any) => {
                const created =
                  link.createdAt instanceof Date
                    ? link.createdAt.toISOString()
                    : String(link.createdAt ?? "");

                const merchant = link.merchantName ?? "—";
                const clicks = link._count?.clicks ?? 0;
                const label = link.label ?? "";

                return (
                  <tr key={link.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-2 align-top text-gray-700">
                      <div className="font-mono text-xs truncate max-w-[160px]">
                        {created}
                      </div>
                    </td>
                    <td className="px-4 py-2 align-top text-gray-800">
                      <div className="font-medium">{merchant}</div>
                      <div className="text-xs text-gray-500">
                        {link.merchantDomain ?? ""}
                      </div>
                    </td>
                    <td className="px-4 py-2 align-top">
                      <div className="max-w-[260px] truncate text-xs text-blue-700">
                        {link.shortUrl || "—"}
                      </div>
                      <div className="max-w-[260px] truncate text-xs text-gray-500">
                        {link.originalUrl}
                      </div>
                    </td>
                    <td className="px-4 py-2 align-top text-gray-800">
                      {clicks}
                    </td>
                    <td className="px-4 py-2 align-top text-gray-700">
                      {label ? (
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                          {label}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
