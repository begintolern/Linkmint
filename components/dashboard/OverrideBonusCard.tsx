"use client";

import { useEffect, useState } from "react";

type Totals = { pending: number; approved: number; paid: number };

export default function OverrideBonusCard() {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/user/overrides/summary", { cache: "no-store" });
        const j = await res.json();
        if (!alive) return;
        if (!res.ok || !j.success) {
          setErr(j.error || `HTTP ${res.status}`);
        } else {
          setTotals(j.totals as Totals);
        }
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Network error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="bg-white shadow-md rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Override Bonuses</h2>
        {loading && <span className="text-xs text-gray-500">Loading…</span>}
      </div>

      {err && (
        <p className="text-sm text-red-600">
          {err}
        </p>
      )}

      {!err && totals && (
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-2">
            <div className="text-sm text-gray-500">Pending</div>
            <div className="text-xl font-bold">${totals.pending.toFixed(2)}</div>
          </div>
          <div className="p-2">
            <div className="text-sm text-gray-500">Approved</div>
            <div className="text-xl font-bold">${totals.approved.toFixed(2)}</div>
          </div>
          <div className="p-2">
            <div className="text-sm text-gray-500">Paid</div>
            <div className="text-xl font-bold">${totals.paid.toFixed(2)}</div>
          </div>
        </div>
      )}

      {!err && !loading && !totals && (
        <p className="text-sm text-gray-500">No overrides yet.</p>
      )}
    </div>
  );
}
