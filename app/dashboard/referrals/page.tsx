// app/dashboard/referrals/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import dynamic from "next/dynamic";

const ReferralsTab = dynamic(() => import("@/components/dashboard/ReferralsTab"), { ssr: false });

export default async function ReferralsDashboardPage() {
  const session: any = await getServerSession(authOptions); // loosen typing

  if (!session?.user?.email) {
    redirect("/login?next=/dashboard/referrals");
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-wide text-zinc-500">Dashboard</div>
        <h1 className="text-2xl font-semibold mt-1">Referrals</h1>
      </div>

      <ReferralsTab />
    </div>
  );
}
