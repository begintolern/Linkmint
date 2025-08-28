// app/dashboard/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import LogoutButton from "@/components/dashboard/LogoutButton";

const ReferralLinkCard = dynamic(() => import("./components/ReferralLinkCard"), { ssr: false });

import CommissionCard from "@/components/dashboard/CommissionCard";
import OverrideBonusCard from "@/components/dashboard/OverrideBonusCard";
import PayoutMethodCard from "@/components/dashboard/PayoutMethodCard";
import PayoutRequestCard from "@/components/dashboard/PayoutRequestCard";
import ReferralBonusBanner from "@/components/dashboard/ReferralBonusBanner";
import ReferralCardWrapper from "@/components/dashboard/ReferralCardWrapper";
import ReferralStatusCard from "@/components/dashboard/ReferralStatusCard";
import ReferralSummaryCard from "@/components/dashboard/ReferralSummaryCard";
import EarningsCard from "@/components/dashboard/EarningsCard";
// import FounderRewardCard from "@/components/dashboard/FounderRewardCard";

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setUserId(j?.user?.id ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <LogoutButton />
      </div>

      <ReferralBonusBanner />
      <ReferralLinkCard />

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
