"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import OnboardingTour from "@/app/components/OnboardingTour";
import WelcomeTourPrompt from "@/app/components/WelcomeTourPrompt";

// Stop prerender & caching (prevents build-time DB calls)
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const params = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [showTour, setShowTour] = useState(false);
  const [tourKey, setTourKey] = useState<number>(0);

  // 🔒 Global + URL kill-switch
  const tourDisabled = useMemo(
    () =>
      process.env.NEXT_PUBLIC_TOUR_ENABLED === "false" ||
      params?.get("notour") === "1",
    [params]
  );

  // Fetch session (CSR only)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setUser(data?.user || null);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const startTour = useCallback(() => {
    if (tourDisabled) return;
    setTourKey(Date.now());
    setShowTour(true);
  }, [tourDisabled]);

  const exitTour = useCallback(() => {
    try {
      localStorage.setItem("tourDismissed", "1");
    } catch {}
    setShowTour(false);
    try {
      window.scrollTo({ top: 0, behavior: "auto" });
    } catch {}
  }, []);

  return (
    <div className="p-6">
      {/* CSS kill-switch: when tourDisabled, hide any Joyride artifacts safely */}
      {tourDisabled && (
        <style jsx global>{`
          .react-joyride__overlay,
          .react-joyride__tooltip,
          .react-joyride__beacon,
          [data-test-id="react-joyride"] {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
          body[aria-hidden="true"] {
            aria-hidden: false !important;
          }
        `}</style>
      )}

      {/* TOUR (only when enabled + active) */}
      {showTour && !tourDisabled && (
        <>
          <button
            onClick={exitTour}
            className="fixed right-3 top-3 z-[10000] px-3 py-2 rounded-lg border bg-white/90 hover:bg-white shadow"
            title="Exit tour and return to dashboard"
          >
            Exit tour
          </button>

          <OnboardingTour key={tourKey} replay onClose={exitTour} />
        </>
      )}

      {/* Banner (only when tour enabled and not active) */}
      {!showTour && !tourDisabled && <WelcomeTourPrompt />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          Welcome{user?.email ? `, ${user.email}` : ""}
        </h1>
        <div className="flex items-center gap-3">
          {!tourDisabled && (
            <button
              onClick={startTour}
              className="px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-black"
            >
              Take a quick tour
            </button>
          )}
          <div id="tour-finish" />
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          id="tour-create-link"
          className="border rounded-2xl p-4 shadow-sm hover:shadow-md transition"
        >
          <h2 className="text-lg font-semibold mb-2">Create Smart Link</h2>
          <p className="text-sm text-gray-600 mb-4">
            Generate affiliate links with built-in tracking and compliance.
          </p>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Create Link
          </button>
        </div>

        <div
          id="tour-merchant-rules"
          className="border rounded-2xl p-4 shadow-sm hover:shadow-md transition"
        >
          <h2 className="text-lg font-semibold mb-2">
            Merchant Rules + AI Suggestions
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            See merchant policies and use AI to find trending offers.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Explore Merchants
          </button>
        </div>

        <div
          id="tour-referrals"
          className="border rounded-2xl p-4 shadow-sm hover:shadow-md transition"
        >
          <h2 className="text-lg font-semibold mb-2">Referrals</h2>
          <p className="text-sm text-gray-600 mb-4">
            Invite friends to earn 5% override bonuses for 90 days.
          </p>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Invite Friends
          </button>
        </div>

        <div
          id="tour-trust-center"
          className="border rounded-2xl p-4 shadow-sm hover:shadow-md transition"
        >
          <h2 className="text-lg font-semibold mb-2">Trust Center</h2>
          <p className="text-sm text-gray-600 mb-4">
            Learn about payout rules, verification, and how funds clear.
          </p>
          <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
            View Details
          </button>
        </div>

        <div
          id="tour-payouts"
          className="border rounded-2xl p-4 shadow-sm hover:shadow-md transition"
        >
          <h2 className="text-lg font-semibold mb-2">Payouts</h2>
          <p className="text-sm text-gray-600 mb-4">
            Track pending and completed payouts, view PayPal fee details.
          </p>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            View Payouts
          </button>
        </div>
      </div>
    </div>
  );
}
