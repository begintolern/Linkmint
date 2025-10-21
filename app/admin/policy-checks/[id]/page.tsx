// app/admin/policy-checks/[id]/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Policy Check — Details",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: { id: string } }) {
  // allow either role=admin or admin_key cookie
  const role = (cookies().get("role")?.value || "").toLowerCase();
  const hasAdminKey = !!cookies().get("admin_key")?.value;
  if (!(role === "admin" || hasAdminKey)) notFound();

  const log = await prisma.policyCheckLog.findUnique({
    where: { id: params.id },
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
      findings: true,
      rawResult: true,
    },
  });

  if (!log) notFound();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <a href="/admin/policy-checks" className="text-sm text-blue-600 hover:underline">
        ← Back to logs
      </a>

      <h1 className="text-2xl font-semibold">Policy Check Details</h1>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="font-medium">ID:</span> {log.id}</div>
        <div><span className="font-medium">Created:</span> {new Date(log.createdAt).toLocaleString()}</div>
        <div><span className="font-medium">Severity:</span> {log.severity}</div>
        <div><span className="font-medium">Engine:</span> {log.engine}</div>
        <div><span className="font-medium">Chars:</span> {log.inputChars}</div>
        <div><span className="font-medium">User ID:</span> {log.userId ?? "—"}</div>
        <div><span className="font-medium">IP:</span> {log.ip ?? "—"}</div>
        <div className="col-span-2">
          <span className="font-medium">Categories:</span>{" "}
          {log.categories?.length ? log.categories.join(", ") : "—"}
        </div>
        <div className="col-span-2">
          <span className="font-medium">User-Agent:</span>
          <div className="mt-1 break-words">{log.userAgent ?? "—"}</div>
        </div>
        <div className="col-span-2">
          <span className="font-medium">Sample Text:</span>
          <div className="mt-1 whitespace-pre-wrap border rounded p-3 bg-gray-50">
            {log.sampleText ?? "—"}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="font-semibold mb-1">Findings</h2>
          <pre className="text-sm whitespace-pre-wrap border rounded p-3 bg-gray-50">
            {JSON.stringify(log.findings ?? null, null, 2)}
          </pre>
        </div>
        <div>
          <h2 className="font-semibold mb-1">Raw Result</h2>
          <pre className="text-sm whitespace-pre-wrap border rounded p-3 bg-gray-50">
            {JSON.stringify(log.rawResult ?? null, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
