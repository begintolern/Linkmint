// app/dashboard/referrals/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import ReferralStatusCard from "@/components/ReferralStatusCard";
import { redirect } from "next/navigation";

export default async function ReferralsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Your Referral Status</h1>
      <ReferralStatusCard userId={session.user.id} />
    </div>
  );
}