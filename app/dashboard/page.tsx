// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CommissionCard } from "@/components/CommissionCard";

export default function DashboardPage() {
  // Step 1: first-time welcome
  const [showWelcome, setShowWelcome] = useState(false);
  // Step 2: stage tracker tip (can be dismissed independently)
  const [showStageTip, setShowStageTip] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("seenDashboardWelcome")) {
      setShowWelcome(true);
    }
    if (!localStorage.getItem("seenStageTip")) {
      setShowStageTip(true);
    }
  }, []);

  const dismissWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem("seenDashboardWelcome", "1");
  };

  const dismissStageTip = () => {
    setShowStageTip(false);
    localStorage.setItem("seenStageTip", "1");
  };

  return (
    <main className="p-6 space-y-6">
      {/* Welcome card (first login) */}
      {showWelcome && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 flex items-start justify-between">
          <div className="pr-3">
            <strong className="block mb-1">Welcome to Linkmint! 🎉</strong>
            <p>
              Share your link → when someone buys, it shows as <em>Pending</em>. After the store
              confirms, it becomes <em>Approved</em>; once funds arrive at Linkmint, it’s{" "}
              <em>Eligible</em> for payout to your <strong>GCash</strong>.
            </p>
          </div>
          <button
            onClick={dismissWelcome}
            className="ml-4 text-emerald-900/80 hover:underline text-xs shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stage tracker tip (compact, dismissible) */}
      {showStageTip && (
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold mr-1">How earnings move:</span>
            <StagePill label="Pending" tone="amber" />
            <Arrow />
            <StagePill label="Approved" tone="blue" />
            <Arrow />
            <StagePill label="Eligible" tone="emerald" />
            <Arrow />
            <StagePill label="Paid" tone="slate" />
            <div className="ml-auto flex items-center gap-3">
              <Link
                href="/trust-center"
                className="underline text-gray-700 hover:text-emerald-700"
              >
                Trust Center
              </Link>
              <Link href="/tutorial" className="underline text-gray-700 hover:text-emerald-700">
                Tutorial
              </Link>
              <button
                onClick={dismissStageTip}
                className="rounded px-2 py-1 ring-1 ring-gray-300 hover:bg-gray-50"
                aria-label="Dismiss"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Your existing dashboard content */}
      <CommissionCard />
    </main>
  );
}

/* --- tiny helpers --- */
function StagePill({ label, tone }: { label: string; tone: "amber" | "blue" | "emerald" | "slate" }) {
  const tones: Record<string, string> = {
    amber: "bg-amber-100 text-amber-800 ring-amber-200",
    blue: "bg-blue-100 text-blue-800 ring-blue-200",
    emerald: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    slate: "bg-slate-100 text-slate-800 ring-slate-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${tones[tone]}`}>
      {label}
    </span>
  );
}

function Arrow() {
  return <span className="text-gray-400">→</span>;
}
