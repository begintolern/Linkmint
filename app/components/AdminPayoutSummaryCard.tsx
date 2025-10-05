"use client";

import { useEffect, useState } from "react";

type Stats = {
  totalPaid: number;
  paidCount: number;
  avgPaid: number;
  pendingTotal: number;
  pendingCount: number;
  failedCount: number;
  lastPaidAt: string | null;
};

export default function AdminPayoutSummaryCard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/admin/payout-stats", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) setStats(data.stats);
    } catch (e) {
      console.error("Failed to load payout stats:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border p-4 text-sm text-gray-500">
        Loading summary…
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-xl border p-4 text-sm text-gray-500">
        No payout data available.
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4 sm:p-5 bg-white shadow-sm">
      <h2 className="text-base font-semibold mb-3">Payout Overview</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-gray-500">Total Paid</div>
          <div className="font-semibold">₱{stats.totalPaid.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-500">Pending Total</div>
          <div className="font-semibold">₱{stats.pendingTotal.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-500">Failed Requests</div>
          <div className="font-semibold">{stats.failedCount}</div>
        </div>
        <div>
          <div className="text-gray-500">Paid Count</div>
          <div className="font-semibold">{stats.paidCount}</div>
        </div>
        <div>
          <div className="text-gray-500">Pending Count</div>
          <div className="font-semibold">{stats.pendingCount}</div>
        </div>
        <div>
          <div className="text-gray-500">Last Paid</div>
          <div className="font-semibold">
            {stats.lastPaidAt
              ? new Date(stats.lastPaidAt).toLocaleString()
              : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
