"use client";

import { useEffect, useState } from "react";

type Totals = {
  all: number;
  pending: number;
  approved: number;
  processing: number;
  paid: number;
};

export default function EarningsPage() {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/user/commissions/summary");
        const data = await res.json();
        setTotals(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading earnings summary...
      </div>
    );
  }

  if (!totals) {
    return (
      <div className="p-6 text-center text-gray-500">
        No earnings data available yet.
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Earnings Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Pending approval" value={totals.pending} />
        <StatCard label="Approved (cleared)" value={totals.approved} />
        <StatCard label="Processing payout" value={totals.processing} />
        <StatCard label="Paid" value={totals.paid} />
      </div>

      <p className="text-xs text-slate-500 mt-1">
        Note: Earnings move from <b>Pending → Approved → Paid</b> after merchant approval.
      </p>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 text-center">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-800">{value}</p>
    </div>
  );
}
