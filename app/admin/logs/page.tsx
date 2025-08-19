// app/admin/logs/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/db";

type LogEntry = {
  id: string;
  type: string;
  message: string | null;
  createdAt: Date;
};

export default async function AdminLogsPage() {
  // ✅ Model is EventLog → client is prisma.eventLog (singular)
  const logs: LogEntry[] = await prisma.eventLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, type: true, message: true, createdAt: true },
  });

  const getLogStyle = (type: string) => {
    switch (type) {
      case "error":
        return "border-red-500 bg-red-50";
      case "payout":
        return "border-green-500 bg-green-50";
      case "signup":
        return "border-blue-500 bg-blue-50";
      case "referral":
        return "border-yellow-400 bg-yellow-50";
      case "trust":
        return "border-purple-500 bg-purple-50";
      default:
        return "border-gray-300 bg-white";
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Event Logs</h1>

      {logs.length === 0 ? (
        <p>No logs found.</p>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => (
            <li
              key={log.id}
              className={`border-l-4 p-3 text-sm shadow ${getLogStyle(log.type)}`}
            >
              <div className="font-semibold uppercase tracking-wide text-xs mb-1">
                [{log.type}]
              </div>
              <div>{log.message || "No message"}</div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(log.createdAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
