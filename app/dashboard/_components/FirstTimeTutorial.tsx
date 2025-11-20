"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "lm_onboarding_seen_v1";

export default function FirstTimeTutorial() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      const seen = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        setHidden(false);
      }
    } catch {
      // if localStorage fails, just show it once
      setHidden(false);
    }
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setHidden(true);
  };

  return (
    <div className="mb-6 rounded-xl border border-teal-700/60 bg-slate-950/70 px-4 py-4 shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">
            Welcome to linkmint.co
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-50">
            How to earn with your smart links (3 quick steps)
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

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {/* Step 1 */}
        <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-3">
          <p className="text-xs font-semibold text-teal-300">Step 1</p>
          <p className="mt-1 text-sm font-semibold text-slate-50">
            Create a smartlink
          </p>
          <p className="mt-1 text-xs text-slate-300">
            Pick a product from Shopee, Lazada, Temu, etc. Paste the URL in
            Linkmint to generate your tracked smartlink.
          </p>
        </div>

        {/* Step 2 */}
        <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-3">
          <p className="text-xs font-semibold text-teal-300">Step 2</p>
          <p className="mt-1 text-sm font-semibold text-slate-50">
            Share anywhere
          </p>
          <p className="mt-1 text-xs text-slate-300">
            Share your link on TikTok, Facebook, IG, Messenger, Viber, or any
            channel you normally use. All traffic should be real people only.
          </p>
        </div>

        {/* Step 3 */}
        <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-3">
          <p className="text-xs font-semibold text-teal-300">Step 3</p>
          <p className="mt-1 text-sm font-semibold text-slate-50">
            Earn from real purchases
          </p>
          <p className="mt-1 text-xs text-slate-300">
            When someone buys through your link and the merchant approves the
            commission, your earnings move toward payout in Linkmint.
          </p>
        </div>
      </div>

      <p className="mt-4 text-[11px] text-slate-400">
        Tip: Focus on honest recommendations and real buyers. This keeps your
        TrustScore healthy and helps you unlock faster payouts over time.
      </p>
    </div>
  );
}
