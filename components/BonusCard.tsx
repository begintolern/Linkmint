"use client";
import { useEffect, useState } from "react";

type BonusSummary = {
  bonusCents: number;
  bonusUSD: number;
  bonusTier: number;
  bonusEligibleUntil: string | null;
  remainingDays: number | null;
};

export default function BonusCard() {
  const [data, setData] = useState<BonusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/user/bonus/summary", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((json) => mounted && setData(json))
      .catch((e) => mounted && setErr(e.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-4 rounded-2xl border bg-white shadow-sm">
        <div className="h-6 w-40 animate-pulse mb-2" />
        <div className="h-4 w-24 animate-pulse" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-4 rounded-2xl border bg-red-50 text-red-700">
        <div className="font-semibold">Bonus</div>
        <div className="text-sm mt-1">Error: {err}</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-5 rounded-2xl border bg-white shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bonus</h3>
        <span className="text-xs px-2 py-1 rounded-full border">
          Tier {data.bonusTier ?? 0}
        </span>
      </div>

      <div className="text-3xl font-bold">
        ${data.bonusUSD.toFixed(2)}
      </div>

      <div className="text-sm text-gray-600">
        {data.remainingDays !== null
          ? data.remainingDays > 0
            ? `${data.remainingDays} day${data.remainingDays === 1 ? "" : "s"} remaining`
            : "Bonus window ended"
          : "No expiration set"}
      </div>

      {data.bonusEligibleUntil && (
        <div className="text-xs text-gray-500">
          Expires: {new Date(data.bonusEligibleUntil).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
