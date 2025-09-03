"use client";
import { useEffect } from "react";

export default function ReferralsTab() {
  useEffect(() => {
    console.log("[ReferralsTab] mounted");
  }, []);
  return (
    <div className="rounded-2xl ring-1 ring-zinc-200 p-5 bg-white/70 dark:bg-zinc-900/70">
      <h3 className="text-lg font-semibold">Your Referrals</h3>
      <p className="mt-2 text-sm text-zinc-600">
        If you can see this, the tab is rendering. Next we’ll hook up live referral data.
      </p>
    </div>
  );
}
