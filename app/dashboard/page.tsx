export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import LinksCard from "./_components/LinksCard";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import Link from "next/link";
import ColoredStats from "./_components/ColoredStats";
import PayoutNotice from "./_components/PayoutNotice";
import FirstTimeTutorial from "./_components/FirstTimeTutorial";
import TrustScoreInfo from "./_components/TrustScoreInfo";

type AppUser = {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
};

export default async function DashboardPage() {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  const user = (session?.user ?? {}) as AppUser;
  const name = user?.email ? user.email.split("@")[0] : user?.name ?? "there";

  const tiles = [
    {
      href: "/dashboard/create-link",
      title: "Create Smart Link",
      subtitle: "Generate a tracked, compliant link",
      tone: "emerald",
    },
    {
      href: "/dashboard/links",
      title: "Manage Links",
      subtitle: "History, refresh, bulk actions",
      tone: "indigo",
    },
    {
      href: "/dashboard/merchants",
      title: "Explore Merchants",
      subtitle: "Policies, payouts, rules",
      tone: "blue",
    },
    {
      href: "/dashboard/earnings",
      title: "Earnings",
      subtitle: "Commissions & performance",
      tone: "yellow",
    },
    {
      href: "/dashboard/payouts",
      title: "Payouts",
      subtitle: "History & accounts",
      tone: "rose",
    },
    {
      href: "/dashboard/referrals",
      title: "Referrals",
      subtitle: "Invite friends · 5% bonus",
      tone: "green",
    },
    {
      href: "/dashboard/settings",
      title: "Settings",
      subtitle: "Manage your account",
      tone: "emerald",
    },
  ] as const;

  const toneClass = (tone: string) => {
    switch (tone) {
      case "emerald":
        return "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700";
      case "blue":
        return "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700";
      case "purple":
        return "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700";
      case "yellow":
        return "bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700";
      case "rose":
        return "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700";
      case "indigo":
        return "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700";
      case "green":
        return "bg-green-50 hover:bg-green-100 border-green-200 text-green-700";
      default:
        return "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800";
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 sm:px-6 py-5">
      {/* Heading */}
      <div className="flex flex-col gap-2">
        <DashboardPageHeader
          title="Overview"
          subtitle={`Welcome back, ${name}! Manage your links, merchants, and payouts.`}
        />

        {/* Quick actions (mobile-first) */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <Link href="/dashboard/create-link" className="btn-primary whitespace-nowrap">
            + Create Smart Link
          </Link>
          <Link href="/dashboard/links" className="btn-secondary whitespace-nowrap">
            Manage Links
          </Link>
          <Link href="/dashboard/earnings" className="btn-secondary whitespace-nowrap">
            View Earnings
          </Link>
        </div>
      </div>

      {/* First-time onboarding tutorial */}
      <FirstTimeTutorial />

      {/* TrustScore explanation card */}
      <TrustScoreInfo />

      {/* 🇵🇭 PH payout update notice */}
      <PayoutNotice />

      {/* Live stats (Pending / Approved / Processing / Paid / Failed / Bonus) */}
      <section aria-label="stats">
        <ColoredStats />
      </section>

      {/* Action tiles — mobile stacks, tablet 2-up, desktop 3-up */}
      <section aria-label="actions">
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {tiles.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`flex min-h-[94px] flex-col justify-between rounded-2xl border p-4 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-black/10 ${toneClass(
                t.tone
              )}`}
            >
              <h3 className="text-base font-semibold">{t.title}</h3>
              <p className="mt-1 text-sm opacity-80">{t.subtitle}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Links Card (kept at the bottom; fully responsive) */}
      <section aria-label="recent-links" className="pt-1">
        <LinksCard />
      </section>
    </main>
  );
}
