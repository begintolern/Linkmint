"use client";

import { useEffect, useState } from "react";
import OnboardingTour from "@/app/components/OnboardingTour";

export default function WelcomeTourPrompt() {
  const [shouldOffer, setShouldOffer] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Offer the tour if:
  // 1) API says user hasn't completed it yet (or API fails), AND
  // 2) User hasn't dismissed it in this browser (localStorage flag)
  useEffect(() => {
    let cancelled = false;

    const dismissed = typeof window !== "undefined" && localStorage.getItem("tourDismissed") === "1";
    if (dismissed) {
      setShouldOffer(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/user/walkthrough/status", { cache: "no-store" });
        if (!res.ok) throw new Error("status error");
        const data = await res.json();
        if (cancelled) return;

        const hasCompleted = !!data?.hasCompletedWalkthrough;
        setShouldOffer(!hasCompleted);
      } catch {
        // If status fails (or DB column not applied yet), still offer once.
        if (!cancelled) setShouldOffer(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function startTour() {
    setShowTour(true);
  }

  function dismiss() {
    try {
      localStorage.setItem("tourDismissed", "1");
    } catch {
      // ignore storage errors
    }
    setShouldOffer(false);
  }

  return (
    <>
      {/* Render the banner only if we should offer it and tour not showing */}
      {shouldOffer && !showTour && (
        <div className="mb-4 rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold">Welcome to linkmint.co</h3>
              <p className="text-sm text-gray-600 mt-1">
                Want a 60-second tour of how to create your first Smart Link, see merchant rules,
                invite friends (5% bonus), and find payouts?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={startTour}
                className="px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-black"
              >
                Start tour
              </button>
              <button
                onClick={dismiss}
                className="px-3 py-2 rounded-lg border hover:bg-gray-50"
                title="You can launch it anytime from the dashboard."
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* When the user clicks Start tour, show the tour (replay mode) */}
      {showTour && <OnboardingTour replay />}
    </>
  );
}
