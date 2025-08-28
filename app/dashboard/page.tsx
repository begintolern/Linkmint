// app/dashboard/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import LogoutButton from "@/components/dashboard/LogoutButton";

// Client-only card already set up
const ReferralLinkCard = dynamic(() => import("./components/ReferralLinkCard"), { ssr: false });

// Cards that don’t require props (or already handle their own data)
import CommissionCard from "@/components/dashboard/CommissionCard";
import OverrideBonusCard from "@/components/dashboard/OverrideBonusCard";
import PayoutMethodCard from "@/components/dashboard/PayoutMethodCard";
import PayoutRequestCard from "@/components/dashboard/PayoutRequestCard";
import ReferralBonusBanner from "@/components/dashboard/ReferralBonusBanner";
import ReferralCardWrapper from "@/components/dashboard/ReferralCardWrapper";
import ReferralStatusCard from "@/components/dashboard/ReferralStatusCard";
import ReferralSummaryCard from "@/components/dashboard/ReferralSummaryCard";

// Cards that require props
import EarningsCard from "@/components/dashboard/EarningsCard";
// import FounderRewardCard from "@/components/dashboard/FounderRewardCard"; // needs extra props we’ll wire later

export default function DashboardPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id as string | undefined;
  const userEmail = (session?.user as any)?.email as string | undefined;

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <LogoutButton />
      </div>

      <ReferralBonusBanner />
      <ReferralLinkCard />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EarningsCard requires userId */}
        {userId ? <EarningsCard userId={userId} /> : null}
        <CommissionCard />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReferralSummaryCard />
        <ReferralStatusCard />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <OverrideBonusCard />
        {/* FounderRewardCard needs: inviterEmail, bonusActive, bonusEndsAt
            We’ll wire real data next; hiding for now to avoid build errors. */}
        {/* <FounderRewardCard inviterEmail={userEmail ?? ""} bonusActive={false} bonusEndsAt={new Date()} /> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PayoutMethodCard />
        <PayoutRequestCard />
      </div>

      <ReferralCardWrapper />
    </main>
  );
}
