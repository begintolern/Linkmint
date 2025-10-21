// app/admin/policy-checks/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Filters from "./Filters";

export const metadata = {
  title: "Policy Check Logs",
  robots: { index: false, follow: false },
};

type SearchParams = {
  severity?: string;
  q?: string;
  from?: string;
  to?: string;
};

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // auth
  const role = (cookies().get("role")?.value || "").toLowerCase();
  const hasAdminKey = !!cookies().get("admin_key")?.value;
  if (!(role === "admin" || hasAdminKey)) notFound();

  const { severity, q, from, to } = searchParams || {};

  // --- summary for last 24h ---
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [high, med, low, none] = await Promise.all([
    prisma.policyCheckLog.count({ where: { severity: "HIGH", createdAt: { gte: since } } }),
    prisma.policyCheckLog.count({ where: { severity: "MEDIUM", createdAt: { gte: since } } }),
    prisma.policyCheckLog.count({ where: { severity: "LOW", createdAt: { gte: since } } }),
    prisma.policyCheckLog.count({ where: { severity: "NONE", createdAt: { gte: since } } }),
  ]);

  // --- main list filters ---
  const where: any = {};
  if (severity && ["NONE", "LOW", "MEDIUM", "HIGH"].includes(severity)) {
    where.severity = severity;
  }
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from + "T00:00:00.000Z");
    if (to) where.createdAt.lte = new Date(to + "T23:59:59.999Z");
  }
  if (q) {
    where.OR = [
      { sampleText: { contains: q, mode: "insensitive" } },
      { engine: { contains: q, mode: "insensitive" } },
      { categories: { has: q } },
    ];
  }

  const logs = await prisma.policyCheckLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      createdAt: true,
      userId: true,
      ip: true,
      userAgent: true,
      inputChars: true,
      engine: true,
      severity: true,
      categories: true,
      sampleText: true,
    },
  });

  // build export query string
  const p = new URLSearchParams();
  if (severity) p.set("severity", severity);
  if (q) p.set("q", q);
  if (from) p.set("from", from);
  if (to) p.set("to", to);
  const qs = p.toString();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Policy Check Logs</h1>

      {/* summary bar */}
      <div className="flex gap-3 text-sm">
        <div className="px-3 py-1 rounded bg-red-100 text-red-700">High {high}</div>
        <div className="px-3 py-1 rounded bg-amber-100 text-amber-700">Medium {med}</div>
        <div className="px-3 py-1 rounded bg-blue-100 text-blue-700">Low {low}</div>
        <div className="px-3 py-1 rounded bg-gray-100 text-gray-700">None {none}</div>
        <div className="ml-auto text-gray-500 italic">last 24 hours</div>
      </div>

      <Filters
        initial={{
          severity: severity ?? "",
          q: q ?? "",
          from: from ?? "",
          to: to ?? "",
        }}
      />

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {logs.length} entries {severity ? `(severity: ${severity})` : ""}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/admin/policy-checks/export${qs ? `?${qs}` : ""}`}
            className="px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-sm"
          >
            Download CSV
          </a>
          <a
            href={`/admin/policy-checks/export.json${qs ? `?${qs}` : ""}`}
            className="px-3 py-1.5 rounded border text-sm"
          >
            Download JSON
          </a>
        </div>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-3 py-2">Details</th>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Severity</th>
              <th className="px-3 py-2">Categories</th>
              <th className="px-3 py-2">Engine</th>
              <th className="px-3 py-2">Chars</th>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">IP</th>
              <th className="px-3 py-2">UA</th>
              <th className="px-3 py-2">Snippet</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="px-3 py-2 whitespace-nowrap">
                  <a
                    href={`/admin/policy-checks/${r.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </a>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-2 font-medium">{r.severity}</td>
                <td className="px-3 py-2">
                  {r.categories?.length ? r.categories.join(", ") : "—"}
                </td>
                <td className="px-3 py-2">{r.engine}</td>
                <td className="px-3 py-2">{r.inputChars}</td>
                <td className="px-3 py-2">{r.userId ?? "—"}</td>
                <td className="px-3 py-2">{r.ip ?? "—"}</td>
                <td className="px-3 py-2 max-w-[260px] truncate" title={r.userAgent ?? ""}>
                  {r.userAgent ?? "—"}
                </td>
                <td className="px-3 py-2 max-w-[380px] truncate" title={r.sampleText ?? ""}>
                  {r.sampleText ?? "—"}
                </td>
              </tr>
            ))}
            {!logs.length && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-gray-500">
                  No logs match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
