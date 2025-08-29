// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import LogoutButton from "@/components/dashboard/LogoutButton";

import CommissionCard from "@/components/dashboard/CommissionCard";
import OverrideBonusCard from "@/components/dashboard/OverrideBonusCard";
import PayoutMethodCard from "@/components/dashboard/PayoutMethodCard";
import PayoutRequestCard from "@/components/dashboard/PayoutRequestCard";
import ReferralBonusBanner from "@/components/dashboard/ReferralBonusBanner";
import ReferralCardWrapper from "@/components/dashboard/ReferralCardWrapper";
import ReferralStatusCard from "@/components/dashboard/ReferralStatusCard";
import ReferralSummaryCard from "@/components/dashboard/ReferralSummaryCard";
import EarningsCard from "@/components/dashboard/EarningsCard";

// ✅ Import the new server component
import ReferralLinkSection from "@/components/ReferralLinkSection";

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setUserId(j?.user?.id ?? null);
        setName(j?.user?.name ?? "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          {name ? <p className="text-sm text-gray-500 mt-1">Hi, {name}</p> : null}
        </div>
        <LogoutButton />
      </div>

      <ReferralBonusBanner />

      {/* ✅ Show referral link copy button */}
      <ReferralLinkSection />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {userId ? <EarningsCard userId={userId} /> : null}
        <CommissionCard />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReferralSummaryCard />
        <ReferralStatusCard />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <OverrideBonusCard />
        {/* FounderRewardCard depends on extra props; we’ll wire later */}
        {/* <FounderRewardCard inviterEmail={""} bonusActive={false} bonusEndsAt={new Date()} /> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PayoutMethodCard />
        <PayoutRequestCard />
      </div>

      <ReferralCardWrapper />
    </main>
  );
}
