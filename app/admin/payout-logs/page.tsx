// app/admin/payout-logs/page.tsx
import { headers } from "next/headers";

type Payout = {
  id: string;
  userId: string | null;
  amount: number;
  method: string;
  status: string;
  details: string | null;
  createdAt: string;
  approvedAt: string | null;
  paidAt: string | null;
};

export const dynamic = "force-dynamic";        // always fresh
export const fetchCache = "force-no-store";

async function getLogs(): Promise<Payout[]> {
  // Call your internal API from the SERVER with the admin header sourced from env
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/admin/payout-logs`, {
    method: "GET",
    headers: {
      "x-admin-key": process.env.ADMIN_KEY ?? "",
    },
    // don’t cache in prod so you see new rows immediately
    cache: "no-store",
  });

  if (!res.ok) {
    // Try same-origin relative URL as a fallback (useful locally)
    const fallback = await fetch(`/api/admin/payout-logs`, {
      method: "GET",
      headers: {
        "x-admin-key": process.env.ADMIN_KEY ?? "",
      },
      cache: "no-store",
    });
    if (!fallback.ok) throw new Error(`Failed to load payout logs (${fallback.status})`);
    const data = await fallback.json();
    return data.logs ?? [];
  }

  const data = await res.json();
  return data.logs ?? [];
}

export default async function AdminPayoutLogsPage() {
  const logs = await getLogs();

  return (
    <main className="px-6 py-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Payout Logs</h1>
      <p className="text-sm text-gray-500 mb-6">
        Showing the most recent payout events from production.
      </p>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Approved</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">ID</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td className="px-4 py-6" colSpan={9}>
                  No payout logs yet.
                </td>
              </tr>
            ) : (
              logs
                .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
                .map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3">{new Date(p.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">${p.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">{p.method}</td>
                    <td className="px-4 py-3">{p.status}</td>
                    <td className="px-4 py-3">{p.userId ?? "—"}</td>
                    <td className="px-4 py-3">{p.approvedAt ? new Date(p.approvedAt).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3">{p.paidAt ? new Date(p.paidAt).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3 max-w-[280px] truncate" title={p.details ?? ""}>
                      {p.details ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.id}</td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
