// app/dashboard/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import DashboardPageHeader from "@/components/DashboardPageHeader";
import { cookies } from "next/headers";
import HealthStatusCard from "@/components/HealthStatusCard";
import DashboardCard from "@/components/DashboardCard";
import RequestPayoutButton from "@/components/RequestPayoutButton";

export default async function DashboardPage() {
  const store = cookies();
  const email = store.get("email")?.value ?? "";
  const name = email ? email.split("@")[0] : "there";
  const role = (store.get("role")?.value ?? "user").toLowerCase();
  const userId = store.get("userId")?.value ?? "";

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
      <DashboardPageHeader title="Overview" subtitle={`Welcome back, ${name}`} />

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard href="/dashboard/links" title="Smart Links" subtitle="Create and manage links" />
        <DashboardCard href="/dashboard/referrals" title="Referrals" subtitle="Invite and track bonuses" badge="5% Bonus" />
        <DashboardCard href="/dashboard/earnings" title="Earnings" subtitle="Commissions and status" />
        <DashboardCard href="/dashboard/payouts" title="Payouts" subtitle="History and accounts" />
        <DashboardCard href="/dashboard/opportunities" title="Opportunities" subtitle="AI-powered trending offers" />
        <DashboardCard href="/dashboard/settings" title="Settings" subtitle="Manage your account" />
      </div>

      <section className="mb-8 rounded-2xl border p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-medium mb-3">🪙 Earnings & Payout</h2>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Total Earnings</p>
            <p className="text-xl sm:text-2xl font-semibold">$11.56</p>
            <p className="text-xs text-gray-500 mt-1">
              PH payouts via GCash or PayPal. Minimum ₱500. Bank or wallet fees may apply.
            </p>
          </div>
          <RequestPayoutButton userId={userId} />
        </div>
      </section>

      {role === "admin" && (
        <section className="mb-8">
          <HealthStatusCard />
        </section>
      )}

      <p className="text-center text-xs text-gray-400 mt-10">
        Powered by Linkmint.co | © 2025 Golden Twin Ventures Inc.
      </p>
    </div>
  );
}
