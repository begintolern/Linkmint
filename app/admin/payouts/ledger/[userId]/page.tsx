// app/admin/payouts/ledger/[userId]/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import React from "react";

type LedgerRow = {
  id: string;
  createdAt: string;
  type: string;
  note?: string | null;
  amountPhp?: number | null;
};

async function loadLedger(userId: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
  const url = new URL(`/api/admin/payouts/ledger?userId=${encodeURIComponent(userId)}`, base);
  const res = await fetch(url.toString(), {
    headers: { "x-admin-key": process.env.ADMIN_API_KEY || "" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Ledger fetch failed (${res.status})`);
  const data = await res.json();
  return data as { ok: boolean; user?: { id: string; email?: string }; items: LedgerRow[] };
}

export default async function LedgerPage({ params }: { params: { userId: string } }) {
  const userId = params.userId;
  const data = await loadLedger(userId);
  const items = data.items || [];

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <a href="/admin/payouts" className="text-sm text-gray-600 hover:underline">
            ← Back to Payouts
          </a>
          <a
            href={`/admin/payouts/ledger/${encodeURIComponent(userId)}/export.csv`}
            className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
          >
            Export CSV
          </a>
        </div>

        <h1 className="text-2xl font-semibold mb-2">
          Payout Ledger — {data.user?.email || userId}
        </h1>

        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Time</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Amount (₱)</th>
                <th className="px-3 py-2 text-left">Note</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                    No entries.
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">{r.type}</td>
                    <td className="px-3 py-2">{r.amountPhp ?? "—"}</td>
                    <td className="px-3 py-2">{r.note || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
