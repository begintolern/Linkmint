// app/dashboard/page.tsx
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";

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
import ReferralLinkSection from "@/components/ReferralLinkSection";
import AttachReferralOnload from "@/components/dashboard/AttachReferralOnload";
import SmartLinkGenerator from "@/components/dashboard/SmartLinkGenerator";
import PayoutMiniCard from "@/components/dashboard/PayoutMiniCard"; // 🆕 compact payouts widget

export default async function DashboardPage() {
  const rawSession = await getServerSession(authOptions);
  const session = rawSession as Session | null;

  const name = session?.user?.name ?? "";
  const userId = (session?.user as any)?.id ?? null;

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
      {/* Attach referral from lm_ref cookie to the logged-in user */}
      <AttachReferralOnload />

      <ReferralLinkSection />
      <SmartLinkGenerator />

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
        {/* FounderRewardCard depends on extra props; wire later */}
        {/* <FounderRewardCard inviterEmail={""} bonusActive={false} bonusEndsAt={new Date()} /> */}
      </div>

      {/* 🆕 Add compact payouts widget alongside payout method and request */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PayoutMethodCard />
        <PayoutRequestCard />
        <PayoutMiniCard /> {/* shows default method + last payout at a glance */}
      </div>

      <ReferralCardWrapper />
    </main>
  );
}
