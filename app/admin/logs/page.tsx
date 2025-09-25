// app/admin/logs/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { assertAdmin } from "@/lib/utils/adminGuard";
import { prisma } from "@/lib/db";

type LogRow = {
  id: string;
  type: string;
  message: string | null;
  detail: string | null;
  createdAt: Date | string;
  userId: string | null;
};

export default async function AdminLogsPage() {
  await assertAdmin();

  const logs: LogRow[] = await prisma.eventLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, type: true, message: true, detail: true, createdAt: true, userId: true },
  });

  const chip = (type: string) => {
    const base = "rounded-md px-2 py-0.5 text-xs";
    switch (type) {
      case "error":      return `${base} bg-red-100 text-red-700`;
      case "payout":     return `${base} bg-green-100 text-green-700`;
      case "signup":     return `${base} bg-blue-100 text-blue-700`;
      case "referral":   return `${base} bg-yellow-100 text-yellow-800`;
      case "commission": return `${base} bg-emerald-100 text-emerald-800`;
      case "admin":      return `${base} bg-purple-100 text-purple-800`;
      default:           return `${base} bg-zinc-100 text-zinc-700`;
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-bold">Admin · Logs</h1>
      <p className="text-sm text-slate-600 mt-1">Latest 100 events</p>

      <div className="mt-6 grid gap-3">
        {logs.map((log: LogRow) => (
          <div key={log.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className={chip(log.type)}>{log.type}</span>
              <span className="text-xs text-slate-500">
                {new Date(log.createdAt as any).toLocaleString()}
              </span>
            </div>
            <div className="mt-2 text-sm">
              <span className="font-medium">{log.message}</span>
              {log.userId && (
                <span className="ml-2 text-xs text-slate-500">· user: {log.userId}</span>
              )}
            </div>
            {log.detail && (
              <pre className="mt-2 whitespace-pre-wrap break-words rounded bg-slate-50 p-3 text-xs ring-1 ring-slate-200">
                {log.detail}
              </pre>
            )}
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-sm text-slate-600">No logs yet.</div>
        )}
      </div>
    </main>
  );
}
