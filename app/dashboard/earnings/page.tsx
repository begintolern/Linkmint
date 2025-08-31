// app/dashboard/earnings/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";

import EarningsCard from "@/components/dashboard/EarningsCard";
import CommissionCard from "@/components/dashboard/CommissionCard";
import PayoutMiniCard from "@/components/dashboard/PayoutMiniCard";

export default async function DashboardEarningsPage() {
  const raw = await getServerSession(authOptions);
  const session = raw as Session | null;
  const userId = (session?.user as any)?.id ?? null;

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Earnings</h1>
        <p className="text-sm text-gray-600">
          Your totals, recent commissions, and payout snapshot.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {userId ? <EarningsCard userId={userId} /> : null}
        <CommissionCard />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PayoutMiniCard />
      </div>
    </main>
  );
}
