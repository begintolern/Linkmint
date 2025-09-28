"use client";
import { useEffect, useState } from "react";

type BonusData = {
  ok: boolean;
  totals?: { totalReferrals: number; permanentOverrideBps: number };
  milestones?: { at: number; bps: number }[];
  error?: string;
};

export default function BonusHeader() {
  const [data, setData] = useState<BonusData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/referral-bonus", { cache: "no-store" });
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setData({ ok: false, error: e.message });
      }
    })();
  }, []);

  if (!data?.ok) return null;

  const refs = data.totals?.totalReferrals ?? 0;
  const bps = data.totals?.permanentOverrideBps ?? 0;
  const pct = (bps / 100).toFixed(2);

  // Find next milestone
  const milestones = data.milestones ?? [
    { at: 15, bps: 100 },
    { at: 30, bps: 200 },
    { at: 60, bps: 300 },
    { at: 100, bps: 500 },
  ];
  const next = milestones.find(m => refs < m.at);

  return (
    <div className="mb-4 rounded-2xl ring-1 ring-emerald-200 bg-emerald-50 p-4">
      <div className="text-xs uppercase tracking-wide text-emerald-700">Permanent Bonus (v2)</div>
      <div className="mt-1 text-lg font-semibold">
        +{pct}% <span className="text-sm font-normal text-emerald-900/70">from {refs} referrals</span>
      </div>
      <div className="mt-2 h-2 w-full rounded bg-emerald-100 overflow-hidden">
        <div
          className="h-2 bg-emerald-500"
          style={{
            width: `${
              Math.min(
                100,
                Math.round(
                  (Math.min(refs, next ? next.at : milestones[milestones.length - 1].at) /
                    (next ? next.at : milestones[milestones.length - 1].at)) * 100
                )
              )
            }%`,
          }}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-emerald-900/70">
        <span>
          {next
            ? `${refs}/${next.at} refs → next +${(next.bps / 100).toFixed(2)}%`
            : `Max milestone reached`}
        </span>
        <span>
          Milestones: {milestones.map(m => `+${(m.bps / 100).toFixed(2)}%@${m.at}`).join(" · ")}
        </span>
      </div>
    </div>
  );
}
