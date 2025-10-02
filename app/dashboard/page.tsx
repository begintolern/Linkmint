// app/dashboard/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import DashboardPageHeader from "@/components/DashboardPageHeader";
import { cookies } from "next/headers";
import HealthStatusCard from "@/components/HealthStatusCard";
import DashboardCard from "@/components/DashboardCard";

export default async function DashboardPage() {
  const store = cookies();
  const email = store.get("email")?.value ?? "";
  const name = email ? email.split("@")[0] : "there";
  const roleCookie = store.get("role")?.value ?? "user";
  const role = roleCookie.toLowerCase();

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <DashboardPageHeader
        title="Overview"
        subtitle={`Welcome back, ${name}`}
      />

      {/* Tools Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          href="/dashboard/links"
          title="Smart Links"
          subtitle="Create and manage links"
        />
        <DashboardCard
          href="/dashboard/referrals"
          title="Referrals"
          subtitle="Invite and track bonuses"
          badge="5% Bonus"
        />
        <DashboardCard
          href="/dashboard/earnings"
          title="Earnings"
          subtitle="Commissions and status"
        />
        <DashboardCard
          href="/dashboard/payouts"
          title="Payouts"
          subtitle="History and accounts"
        />
        <DashboardCard
          href="/dashboard/opportunities"
          title="Opportunities"
          subtitle="AI-powered trending offers"
        />
        <DashboardCard
          href="/dashboard/settings"
          title="Settings"
          subtitle="Manage your account"
        />
      </div>

      {/* Earnings Summary */}
      <section className="mb-8 rounded-2xl border p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-medium mb-2">🪙 Earnings Summary</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Total Earnings</p>
            <p className="text-xl sm:text-2xl font-semibold">$11.56</p>
          </div>
          <span className="rounded-full border px-3 py-1 text-xs sm:text-sm text-gray-700">
            Not Eligible
          </span>
        </div>
      </section>

      {/* System Health — ADMIN ONLY */}
      {role === "admin" && (
        <section className="mb-8">
          <HealthStatusCard />
        </section>
      )}
    </div>
  );
}
