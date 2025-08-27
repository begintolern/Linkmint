// app/dashboard/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

// NextAuth (v4)
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

// Dashboard components
import LogoutButton from "@/components/dashboard/LogoutButton";
import ReferralCardWrapper from "@/components/dashboard/ReferralCardWrapper";
import ReferralStatusCard from "@/components/dashboard/ReferralStatusCard";
import CommissionCard from "@/components/dashboard/CommissionCard";
import FounderRewardCard from "@/components/dashboard/FounderRewardCard";
import ReferralSummaryCard from "@/components/dashboard/ReferralSummaryCard";

// Payout widgets
import PayoutMethodCard from "@/components/dashboard/PayoutMethodCard";
import CashOutCard from "@/components/dashboard/CashOutCard"; // ✅ single cash-out section

export default async function DashboardPage() {
  const session = (await getServerSession(authOptions as any)) as any;

  if (!session || !session.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
    select: {
      id: true,
      email: true,
      emailVerifiedAt: true,
      trustScore: true,
      createdAt: true,
      referredBy: { select: { email: true } },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Founder bonus window: 90 days from account creation
  const createdAt =
    user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt as any);
  const bonusEnds = new Date(createdAt.getTime() + 90 * 24 * 60 * 60 * 1000);
  const bonusActive = Date.now() < bonusEnds.getTime();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Welcome to your Dashboard!</h1>
        <LogoutButton />
      </div>

      {/* Founder reward / inviter context */}
      <FounderRewardCard
        inviterEmail={user.referredBy?.email ?? null}
        bonusActive={bonusActive}
        bonusEndsAt={bonusEnds.toISOString()}
      />

      {/* Identity + trust quick facts */}
      <div className="bg-white shadow-md rounded-lg p-4 border">
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Email Verified:</strong>{" "}
          {user.emailVerifiedAt ? (
            <span className="text-green-600">Yes</span>
          ) : (
            <span className="text-red-600">No</span>
          )}
        </p>
        <p>
          <strong>Trust Score:</strong> {user.trustScore ?? "N/A"}
        </p>
      </div>

      {/* Main cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReferralCardWrapper />
        <ReferralStatusCard />
        <CommissionCard />
        <ReferralSummaryCard />
      </div>

      {/* Payout section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PayoutMethodCard />
        <CashOutCard /> {/* ✅ only one Cash Out component */}
      </div>
    </div>
  );
}
