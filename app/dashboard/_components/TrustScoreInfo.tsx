"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "lm_trustscore_seen_v1";

export default function TrustScoreInfo() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      const seen = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY);
      if (!seen) setHidden(false);
    } catch {
      setHidden(false);
    }
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setHidden(true);
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4 shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">
            TrustScore
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">
            How TrustScore affects your payouts
          </h2>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          Dismiss
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-300 leading-relaxed">
        Your TrustScore helps keep linkmint.co safe and fair.
        High TrustScore = faster payout reviews, earlier payouts when eligible,
        and smooth commission processing.
      </p>

      <ul className="mt-3 space-y-1 text-xs text-slate-400">
        <li>• Share links honestly (no spam or fake clicks)</li>
        <li>• Avoid self-purchases</li>
        <li>• Use real accounts and real traffic</li>
        <li>• Keep referrals legitimate</li>
      </ul>
    </div>
  );
}
