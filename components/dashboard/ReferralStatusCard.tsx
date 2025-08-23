// components/dashboard/ReferralStatusCard.tsx
"use client";

import { useEffect, useState } from "react";

type Group = {
  id: string;
  status: "ACTIVE" | "EXPIRED" | "UNKNOWN";
  startedAt: string | null;
  expiresAt: string | null;
  daysRemaining: number | null;
  members: string[];
};

type ApiResp =
  | {
      success: true;
      ungroupedInvitees: number;
      groups: Group[];
    }
  | {
      success: false;
      error: string;
    };

export default function ReferralStatusCard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResp | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/referrals", { cache: "no-store" });
        const json = (await res.json()) as ApiResp;
        if (mounted) setData(json);
      } catch (e) {
        if (mounted)
          setData({ success: false, error: "Failed to load referrals." });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl p-5 border border-gray-200 shadow-sm">
        <div className="h-5 w-40 animate-pulse bg-gray-200 rounded mb-3" />
        <div className="h-4 w-72 animate-pulse bg-gray-100 rounded" />
      </div>
    );
  }

  if (!data || data.success === false) {
    return (
      <div className="rounded-2xl p-5 border border-red-200 bg-red-50 text-red-700">
        <div className="font-semibold mb-1">Referral Status</div>
        <div>{data?.error ?? "Unable to load referral data."}</div>
      </div>
    );
  }

  const { ungroupedInvitees, groups } = data;

  return (
    <div className="rounded-2xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Referral Status</h2>
        <div className="text-sm text-gray-600">
          Ungrouped invitees: <span className="font-medium">{ungroupedInvitees}</span>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="text-sm text-gray-700">
          No referral batches yet. Invite <span className="font-semibold">3 people</span> to
          unlock a 90‑day 5% bonus window.
        </div>
      ) : (
        <ul className="space-y-3">
          {groups.map((g) => {
            const started = g.startedAt ? new Date(g.startedAt) : null;
            const expires = g.expiresAt ? new Date(g.expiresAt) : null;
            return (
              <li
                key={g.id}
                className="p-4 rounded-xl border bg-white flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Batch #{g.id.slice(0, 6)}</div>
                  <StatusPill status={g.status} />
                </div>

                <div className="text-xs text-gray-600">
                  {started ? `Started: ${started.toLocaleDateString()}` : "Start: —"} ·{" "}
                  {expires ? `Expires: ${expires.toLocaleDateString()}` : "Expires: —"} ·{" "}
                  {g.daysRemaining !== null ? `${g.daysRemaining} days left` : "—"}
                </div>

                <div className="text-xs text-gray-700">
                  Members:{" "}
                  {g.members.length > 0 ? g.members.join(", ") : "—"}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: Group["status"] }) {
  const map: Record<Group["status"], string> = {
    ACTIVE: "bg-green-100 text-green-700 border-green-200",
    EXPIRED: "bg-gray-100 text-gray-700 border-gray-200",
    UNKNOWN: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full border ${map[status] ?? ""}`}
    >
      {status}
    </span>
  );
}
