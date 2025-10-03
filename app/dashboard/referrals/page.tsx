// app/dashboard/referrals/page.tsx
"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useState } from "react";
import DashboardPageHeader from "@/components/DashboardPageHeader";

type ApiOk = {
  success: true;
  ungroupedInvitees: number;
  groups: Array<{
    id: string;
    status: "ACTIVE" | "EXPIRED" | "UNKNOWN";
    startedAt: string | null;
    expiresAt: string | null;
    daysRemaining: number | null;
    members: Array<string | null>;
  }>;
  badge: string | null;
  referralCode: string | null;
  debug?: any;
};
type ApiErr = { success: false; error?: string };
type ApiResp = ApiOk | ApiErr;

export default function ReferralsPage() {
  const [data, setData] = useState<ApiOk | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/referrals", {
          cache: "no-store",
          credentials: "include",
        });

        if (cancelled) return;

        let json: ApiResp | null = null;
        try {
          json = (await res.json()) as ApiResp;
        } catch {
          json = null;
        }

        // If 401, DO NOT show an error; treat as empty state so the page stays clean
        if (!res.ok) {
          if (res.status === 401) {
            setData({
              success: true,
              ungroupedInvitees: 0,
              groups: [],
              badge: null,
              referralCode: null,
            } as ApiOk);
            setErr(null);
            return;
          }
          // Only show an error for real failures (5xx, etc.)
          setErr((json as ApiErr)?.error || "Failed to load referrals.");
          setData(null);
          return;
        }

        // 200 OK
        if (json && "success" in json && json.success) {
          setData(json);
          setErr(null);
          return;
        }

        // 200 OK but unexpected shape — fall back to empty
        setData({
          success: true,
          ungroupedInvitees: 0,
          groups: [],
          badge: null,
          referralCode: null,
        } as ApiOk);
        setErr(null);
      } catch (e: any) {
        if (cancelled) return;
        // Network-level failure — show a generic message
        setErr(e?.message || "Failed to load referrals.");
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(() => {
    const invites =
      data?.groups?.reduce((acc, g) => acc + (g.members?.length || 0), 0) ?? 0;
    return { invites, groups: data?.groups?.length ?? 0 };
  }, [data]);

  const inviteUrl = useMemo(() => {
    if (!data?.referralCode) return null;
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "https://linkmint.co";
      return `${origin}/signup?ref=${encodeURIComponent(data.referralCode)}`;
    } catch {
      return null;
    }
  }, [data?.referralCode]);

  return (
    <main className="space-y-6">
      <DashboardPageHeader
        title="Referrals 5% Bonus"
        subtitle="Invite friends, form batches of 3, and earn 5% bonus commissions for 90 days."
        rightSlot={
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <Badge label="Groups" value={totals.groups} />
            <Badge label="Invites" value={totals.invites} />
          </div>
        }
      />

      {/* Only show a banner for real failures, not 401 */}
      {err && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-800 p-3 text-sm">
          {err} — showing empty results.
        </div>
      )}

      {/* Referral link */}
      <section className="rounded-2xl border bg-white p-4 sm:p-5 space-y-3">
        <h2 className="text-sm sm:text-base font-medium">Your referral link</h2>
        {data?.referralCode ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <code className="rounded-md border px-2 py-1 text-sm bg-gray-50">
              {inviteUrl}
            </code>
            <button
              className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50"
              onClick={() => inviteUrl && navigator.clipboard.writeText(inviteUrl)}
            >
              Copy
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            No referral code yet. Start by inviting friends from your account.
          </p>
        )}
      </section>

      {/* Groups table */}
      <section className="rounded-2xl border bg-white">
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4">
          <h2 className="text-sm sm:text-base font-medium">Your Groups</h2>
          <span className="hidden sm:inline-flex items-center rounded-full border px-3 py-1 text-xs text-gray-700">
            Total groups: {totals.groups}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-left z-10">
              <tr>
                <th className="p-3">Group</th>
                <th className="p-3">Status</th>
                <th className="p-3 hidden sm:table-cell">Expires</th>
                <th className="p-3">Members</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-6 text-gray-500" colSpan={4}>
                    Loading…
                  </td>
                </tr>
              ) : data && data.groups && data.groups.length > 0 ? (
                data.groups.map((g) => (
                  <tr key={g.id} className="border-t">
                    <td className="p-3">{g.id.slice(0, 8)}…</td>
                    <td className="p-3">
                      <span
                        className={
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs " +
                          (g.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : g.status === "EXPIRED"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-amber-100 text-amber-800")
                        }
                      >
                        {g.status}
                      </span>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      {g.expiresAt ? new Date(g.expiresAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-3">
                      {g.members && g.members.length > 0 ? g.members.join(", ") : "—"}
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

function Badge({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center rounded-xl border px-3 py-1.5 text-xs sm:text-sm text-gray-800 bg-white">
      <span className="font-medium">{label}</span>
      <span className="ml-2 tabular-nums">{value}</span>
    </span>
  );
}
