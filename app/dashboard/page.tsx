// app/dashboard/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import DashboardPageHeader from "@/components/DashboardPageHeader";
import Link from "next/link";
import { cookies } from "next/headers";
import HealthStatusCard from "@/components/HealthStatusCard";

export default async function DashboardPage() {
  const store = cookies();
  const email = store.get("email")?.value ?? "";
  const name = email ? email.split("@")[0] : "there";

  return (
    <>
      <DashboardPageHeader
        title="Overview"
        subtitle={`Welcome back, ${name}`}
      />

      {/* Tiles */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Tile title="Smart Links" desc="Create and manage links" href="/dashboard/links" />
        <Tile title="Referrals" desc="Invite and track bonuses" href="/dashboard/referrals" />
        <Tile title="Earnings" desc="Commissions and status" href="/dashboard/earnings" />
        <Tile title="Payouts" desc="History and accounts" href="/dashboard/payouts" />
        {/* AI policy checker */}
        <Tile title="Policy Pre-Check (AI)" desc="Scan captions for risky terms" href="/tools/policy-check" />
      </div>

      {/* Summary */}
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

      {/* System Health */}
      <section className="mb-8">
        <HealthStatusCard />
      </section>
    </>
  );
}

function Tile({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <Link
      href={href}
      role="button"
      aria-label={`${title} — ${desc}`}
      className="rounded-2xl border p-4 sm:p-5 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 min-h-[84px] flex flex-col justify-center"
    >
      <p className="text-[11px] sm:text-xs font-semibold text-gray-500 mb-1">TOOLS</p>
      <h3 className="text-base sm:text-lg font-medium leading-tight">{title}</h3>
      <p className="text-sm text-gray-600 mt-0.5">{desc}</p>
    </Link>
  );
}
