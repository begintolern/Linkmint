// app/dashboard/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

// Use the v4 helper directly
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

import LogoutButton from "@/components/dashboard/LogoutButton";
import ReferralCardWrapper from "@/components/dashboard/ReferralCardWrapper";
import ReferralStatusCard from "@/components/dashboard/ReferralStatusCard";
import CommissionCard from "@/components/dashboard/CommissionCard";
import FounderRewardCard from "@/components/dashboard/FounderRewardCard";

export default async function DashboardPage() {
  // Avoid type friction by casting; v4 accepts plain object
  const session = await (getServerSession as any)(authOptions as any);

  if (!session || !session.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      // ✅ schema uses a timestamp, not a boolean
      emailVerifiedAt: true,
      trustScore: true,
      createdAt: true,
      referredBy: { select: { email: true } }, // inviter
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Founder bonus: 90 days from signup
  const createdAt = user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt as any);
  const bonusEnds = new Date(createdAt.getTime() + 90 * 24 * 60 * 60 * 1000);
  const bonusActive = new Date() < bonusEnds;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Welcome to your Dashboard!</h1>
        <LogoutButton />
      </div>

      <FounderRewardCard
        inviterEmail={user.referredBy?.email ?? null}
        bonusActive={bonusActive}
        bonusEndsAt={bonusEnds.toISOString()}
      />

      <div className="bg-white shadow-md rounded-lg p-4 border">
        <p><strong>Email:</strong> {user.email}</p>
        <p>
          <strong>Email Verified:</strong>{" "}
          {user.emailVerifiedAt ? (
            <span className="text-green-600">Yes</span>
          ) : (
            <span className="text-red-600">No</span>
          )}
        </p>
        <p>
          <strong>Trust Score:</strong>{" "}
          {user.trustScore ?? "N/A"}
        </p>
      </div>

      <ReferralCardWrapper />
      <ReferralStatusCard />
      <CommissionCard />
    </div>
  );
}
