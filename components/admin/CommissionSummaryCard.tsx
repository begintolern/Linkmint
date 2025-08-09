"use client";

import { useEffect, useState } from "react";

type Summary = { pending: number; approved: number; paid: number };

export default function CommissionSummaryCard() {
  const [data, setData] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch("/api/admin/payouts/summary", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load");
        setData(json as Summary);
      } catch (e: any) {
        setErr(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="border rounded-md p-4">
      <h3 className="text-lg font-semibold mb-2">Commissions Summary</h3>
      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
      {data && (
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Pending</div>
            <div className="font-semibold">${data.pending.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-gray-500">Approved</div>
            <div className="font-semibold">${data.approved.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-gray-500">Paid</div>
            <div className="font-semibold">${data.paid.toFixed(2)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
