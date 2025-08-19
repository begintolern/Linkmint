// app/dashboard/referrals/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import ReferralStatusCard from "@/components/ReferralStatusCard";
import { redirect } from "next/navigation";

export default async function ReferralsPage() {
  const session = (await getServerSession(authOptions)) as Session | null;

  // Require an authenticated session with an email
  if (!session?.user?.email) {
    redirect("/login");
  }

  // Safely read id from augmented session (may not be present in base NextAuth types)
  const userId = (session.user as any)?.id as string | undefined;
  if (!userId) {
    redirect("/login");
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Your Referral Status</h1>
      <ReferralStatusCard userId={userId} />
    </div>
  );
}
