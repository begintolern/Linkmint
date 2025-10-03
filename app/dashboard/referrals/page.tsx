// app/dashboard/referrals/page.tsx
"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import StatusBadge from "@/components/StatusBadge";

type Referral = {
  id: string;
  email: string;
  joinedAt: string;
  batchId?: string | null;
  expiresAt?: string | null;
  status?: string;
};

type ApiResponse =
  | { ok: true; referrals: Referral[] }
  | { ok: false; error?: string };

export default function ReferralsPage() {
  const [rows, setRows] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/referrals/list", { cache: "no-store" });
        const json: ApiResponse = await res.json();
        if (!("ok" in json) || !json.ok) {
          throw new Error((json as any)?.error || "Failed to load referrals.");
        }
        setRows(json.referrals ?? []);
      } catch (e: any) {
        setErr(e?.message || "Failed to load referrals.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="space-y-6">
      <DashboardPageHeader
        title="Referrals 5% Bonus"
        subtitle="Invite friends, form batches of 3, and earn 5% bonus commissions for 90 days."
      />

      {err && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-800 p-3 text-sm">
          {err} — showing empty results.
        </div>
      )}

      <section className="rounded-xl border bg-white">
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4">
          <h2 className="text-sm sm:text-base font-medium">Your Invites</h2>
          <span className="hidden sm:inline text-xs text-gray-500">
            Total: {rows.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-left z-10">
              <tr>
                <th className="p-3">Email</th>
                <th className="p-3 hidden sm:table-cell">Joined</th>
                <th className="p-3 hidden sm:table-cell">Batch</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-6 text-gray-500" colSpan={4}>
                    Loading…
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3">{r.email}</td>
                    <td className="p-3 hidden sm:table-cell">
                      {new Date(r.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 hidden sm:table-cell">{r.batchId ?? "—"}</td>
                    <td className="p-3">
                      <StatusBadge status={(r.status || "PENDING") as any} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-6 text-gray-500" colSpan={4}>
                    No referrals yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
