// app/dashboard/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import type { Session } from "next-auth";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import HealthStatusCard from "@/components/HealthStatusCard";
import DashboardCard from "@/components/DashboardCard";
import RequestPayoutButton from "@/components/RequestPayoutButton";
import TrendingSmartItem from "@/components/dashboard/TrendingSmartItem";
import Link from "next/link";

type AppUser = {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
};

async function getFinderRecommendations(baseUrl: string) {
  try {
    const res = await fetch(`${baseUrl}/api/finder/products?limit=3`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.items) ? json.items.slice(0, 3) : [];
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  const user = (session?.user ?? {}) as AppUser;
  const email: string = user.email ?? "";
  const name: string = email ? email.split("@")[0] : user.name ?? "there";
  const role: string = (user.role ?? "user").toLowerCase();
  const userId: string = user.id ?? "";

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
      || (process.env.RAILWAY_STATIC_URL ? `https://${process.env.RAILWAY_STATIC_URL}` : "")
      || "http://localhost:3000";

  const recommendations = await getFinderRecommendations(baseUrl);

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <DashboardPageHeader title="Overview" subtitle={`Welcome back, ${name}`} />

      {/* Tools Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard href="/dashboard/links" title="Smart Links" subtitle="Create and manage links" />
        <DashboardCard href="/dashboard/referrals" title="Referrals" subtitle="Invite and track bonuses" badge="5% Bonus" />
        <DashboardCard href="/dashboard/earnings" title="Earnings" subtitle="Commissions and status" />
        <DashboardCard href="/dashboard/payouts" title="Payouts" subtitle="History and accounts" />
        <DashboardCard href="/dashboard/opportunities" title="Opportunities" subtitle="AI-powered trending offers" />
        <DashboardCard href="/dashboard/settings" title="Settings" subtitle="Manage your account" />
      </div>

      {/* Earnings Summary + Request Payout */}
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

      {/* 🛍️ Trending Products to Share */}
      <section className="mb-8 rounded-2xl border p-4 sm:p-5 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-medium">🛍️ Trending Products to Share</h2>
          <Link href="/dashboard/finder" className="text-sm text-blue-600 hover:underline">
            View More →
          </Link>
        </div>

        {recommendations.length === 0 ? (
          <p className="text-sm text-gray-500">No trending products available right now.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {recommendations.map((item: any) => (
              <TrendingSmartItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* System Health — ADMIN ONLY */}
      {role === "admin" && (
        <section className="mb-8">
          <HealthStatusCard />
        </section>
      )}

      <p className="text-center text-xs text-gray-400 mt-10">
        Powered by Linkmint.co · © 2025 Golden Twin Ventures Inc.
      </p>
    </div>
  );
}
