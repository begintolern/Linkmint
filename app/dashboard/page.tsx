// app/dashboard/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";

import { REGION } from "@/lib/config";
import { getUsdToPhpRate } from "@/lib/fx";
import { formatMoneyPHP, formatMoneyUSD } from "@/lib/currency";

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

function resolveBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.RAILWAY_STATIC_URL) return `https://${process.env.RAILWAY_STATIC_URL}`;
  return "http://localhost:3000";
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

  const baseUrl = resolveBaseUrl();
  const recommendations = await getFinderRecommendations(baseUrl);

  // FX for PH display (backend remains USD)
  const usdToPhp = REGION === "PH" ? await getUsdToPhpRate() : 1;

  // TODO: replace with real totals from your API
  const totalUsd = 11.56;
  const showUsd = role === "admin"; // only admin sees USD reference
const totalLabel =
  REGION === "PH"
    ? formatMoneyPHP(totalUsd, usdToPhp, showUsd)
    : formatMoneyUSD(totalUsd);


  return (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
      {/* Header */}
      <DashboardPageHeader title="Overview" subtitle={`Welcome back, ${name}`} />

      {/* Tools Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        <DashboardCard href="/dashboard/links" title="Smart Links" subtitle="Create and manage links" />
        <DashboardCard href="/dashboard/referrals" title="Referrals" subtitle="Invite and track bonuses" badge="5% Bonus" />
        <DashboardCard href="/dashboard/earnings" title="Earnings" subtitle="Commissions and status" />
        <DashboardCard href="/dashboard/payouts" title="Payouts" subtitle="History and accounts" />
        <DashboardCard href="/dashboard/opportunities" title="Opportunities" subtitle="AI-powered trending offers" />
        <DashboardCard href="/dashboard/settings" title="Settings" subtitle="Manage your account" />
      </div>

      {/* Earnings Summary + Request Payout */}
      <section className="mb-8 rounded-2xl border p-4 sm:p-5">
        <h2 className="mb-3 text-base font-medium sm:text-lg">🪙 Earnings & Payout</h2>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs text-gray-600 sm:text-sm">Total Earnings</p>
            <p className="text-xl font-semibold sm:text-2xl">{totalLabel}</p>
            <p className="mt-1 text-xs text-gray-500">
              PH payouts via GCash or PayPal. Minimum ₱500. Bank or wallet fees may apply.
            </p>
          </div>
          <RequestPayoutButton userId={userId} />
        </div>
      </section>

      {/* 🛍️ Trending Products to Share */}
      <section className="mb-8 rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-medium sm:text-lg">🛍️ Trending Products to Share</h2>
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

      <p className="mt-10 text-center text-xs text-gray-400">
        Powered by Linkmint.co · © {new Date().getFullYear()} Golden Twin Ventures Inc.
      </p>
    </div>
  );
}
