// app/dashboard/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import Link from "next/link";
import LogoutButton from "@/components/dashboard/LogoutButton";
import EarningsCard from "@/components/dashboard/EarningsCard";
import CommissionCard from "@/components/dashboard/CommissionCard";
import PayoutMiniCard from "@/components/dashboard/PayoutMiniCard";
import FallbackAttach from "@/components/dashboard/FallbackAttach";
import EarningsSummary from "@/components/dashboard/EarningsSummary";
import PayoutInfoCard from "@/components/dashboard/PayoutInfoCard"; // ⬅️ new import

export default async function DashboardOverviewPage() {
  const raw = await getServerSession(authOptions);
  const session = raw as Session | null;

  const name = session?.user?.name ?? "";
  const userId = (session?.user as any)?.id ?? null;

  // For now these are placeholders until wired to DB
  const pending = 12.34;
  const approved = 56.78;
  const paid = 90.12;

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      {/* Run fallback referral attach once per session (client-side) */}
      <FallbackAttach />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          {name ? <p className="text-sm text-gray-500 mt-1">Hi, {name}</p> : null}
        </div>
        <LogoutButton />
      </div>

      {/* Quick nav tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/dashboard/links"
          className="rounded-xl border bg-white p-4 shadow-sm hover:shadow transition"
        >
          <div className="text-sm text-gray-600">Go to</div>
          <div className="text-lg font-semibold">Smart Links</div>
          <div className="text-xs text-gray-500 mt-1">Create & manage tracking links</div>
        </Link>

        <Link
          href="/dashboard/referrals"
          className="rounded-xl border bg-white p-4 shadow-sm hover:shadow transition"
        >
          <div className="text-sm text-gray-600">Go to</div>
          <div className="text-lg font-semibold">Referrals</div>
          <div className="text-xs text-gray-500 mt-1">Share invites & track bonuses</div>
        </Link>

        <Link
          href="/dashboard/earnings"
          className="rounded-xl border bg-white p-4 shadow-sm hover:shadow transition"
        >
          <div className="text-sm text-gray-600">Go to</div>
          <div className="text-lg font-semibold">Earnings</div>
          <div className="text-xs text-gray-500 mt-1">Commissions & payout snapshot</div>
        </Link>

        <Link
          href="/dashboard/payouts"
          className="rounded-xl border bg-white p-4 shadow-sm hover:shadow transition"
        >
          <div className="text-sm text-gray-600">Go to</div>
          <div className="text-lg font-semibold">Payouts</div>
          <div className="text-xs text-gray-500 mt-1">History of payout requests</div>
        </Link>
      </div>

      {/* At-a-glance metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {userId ? <EarningsCard userId={userId} /> : null}
        <CommissionCard />
      </div>

      {/* New: Polished Earnings Summary */}
      <EarningsSummary pending={pending} approved={approved} paid={paid} />

      {/* New: Payout Info */}
      <PayoutInfoCard approvedTotal={approved} threshold={5} />

      {/* Snapshot: default payout + last request */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PayoutMiniCard />
      </div>
    </main>
  );
}
