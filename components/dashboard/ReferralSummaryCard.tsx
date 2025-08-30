// components/dashboard/ReferralSummaryCard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function ReferralSummaryCard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResp | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/referrals", { cache: "no-store" });
        const json = (await res.json()) as ApiResp;
        if (mounted) setData(json);
      } catch {
        if (mounted) setData({ success: false, error: "Failed to load data." });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const groups = data && data.success ? data.groups : [];
  const ungroupedInvitees = data && data.success ? data.ungroupedInvitees : 0;

  const groupedEmails = useMemo(() => {
    const s = new Set<string>();
    for (const g of groups) {
      for (const e of g.members) s.add(e);
    }
    return s;
  }, [groups]);

  if (loading) {
    return (
      <div className="rounded-2xl p-5 border border-gray-200 shadow-sm">
        <div className="h-5 w-48 animate-pulse bg-gray-200 rounded mb-3" />
        <div className="h-4 w-64 animate-pulse bg-gray-100 rounded mb-1" />
        <div className="h-4 w-40 animate-pulse bg-gray-100 rounded" />
      </div>
    );
  }

  if (!data || data.success === false) {
    return (
      <div className="rounded-2xl p-5 border border-red-200 bg-red-50 text-red-700">
        <div className="font-semibold mb-1">Referral Summary</div>
        <div>{data?.error ?? "Unable to load referral summary."}</div>
      </div>
    );
  }

  const totalGrouped = groupedEmails.size;
  const totalReferred = totalGrouped + ungroupedInvitees;

  const activeBatches = groups.filter((g) => g.status === "ACTIVE");
  const expiredBatches = groups.filter((g) => g.status === "EXPIRED");

  const activeCount = activeBatches.length;
  const expiredCount = expiredBatches.length;
  const totalBatches = groups.length;

  const remainder = ungroupedInvitees % 3;
  const toNextBatch = remainder === 0 ? 3 : 3 - remainder;

  const hasInviterBadge = totalReferred >= 1;
  const hasActiveReferrer = activeCount >= 1;
  const hasPowerReferrer = activeCount >= 2 || totalReferred >= 6;

  return (
    <div className="rounded-2xl p-5 border border-gray-200 shadow-sm bg-white">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Referral Summary</h2>
        <BadgeStrip
          inviter={hasInviterBadge}
          active={hasActiveReferrer}
          power={hasPowerReferrer}
        />
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Stat label="Total Referred" value={totalReferred} />
        <Stat label="Ungrouped" value={ungroupedInvitees} />
        <Stat label="Batches (Active)" value={`${activeCount}/${totalBatches}`} />
        <Stat label="Batches (Expired)" value={expiredCount} />
      </div>

      {/* CTA */}
      <div className="rounded-xl border p-3 bg-gray-50">
        {ungroupedInvitees === 0 && totalBatches === 0 ? (
          <p className="text-sm text-gray-700">
            Invite <span className="font-semibold">3 people</span> to unlock your first
            90-day <span className="font-semibold">5% bonus</span>.
          </p>
        ) : remainder === 0 ? (
          <p className="text-sm text-gray-700">
            You’re ready to form a new batch — invite{" "}
            <span className="font-semibold">3 more</span> to start another 90-day 5% bonus
            window.
          </p>
        ) : (
          <p className="text-sm text-gray-700">
            Invite <span className="font-semibold">{toNextBatch} more</span>{" "}
            {toNextBatch === 1 ? "person" : "people"} to complete your next batch of 3 and
            start a new 90-day <span className="font-semibold">5% bonus</span> window.
          </p>
        )}
      </div>
    </div>
  );
}

// Stat Component for displaying each stat
function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

// BadgeStrip Component for displaying badges
function BadgeStrip({
  inviter,
  active,
  power,
}: {
  inviter: boolean;
  active: boolean;
  power: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Badge text="Inviter" on={inviter} />
      <Badge text="Active Referrer" on={active} />
      <Badge text="Power Referrer" on={power} />
    </div>
  );
}

// Badge Component for individual badge
function Badge({ text, on }: { text: string; on: boolean }) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full border ${on
        ? "bg-green-100 text-green-700 border-green-200"
        : "bg-gray-100 text-gray-600 border-gray-200"
      }`}
      title={text}
    >
      {text}
    </span>
  );
}
