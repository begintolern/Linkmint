// app/dashboard/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";

import ColoredTile from "@/app/components/ColoredTile";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import {
  Link as LinkIcon,
  Store,
  Sparkles,
  Wallet,
  Coins,
  Settings,
  Gift,
  BadgeDollarSign,
} from "lucide-react";

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

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <DashboardPageHeader
        title="Overview"
        subtitle={`Welcome back, ${name}! Manage your links, merchants, and payouts.`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ColoredTile
          href="/dashboard/create-link"
          title="Create Smart Link"
          subtitle="Generate a tracked, compliant link"
          icon={LinkIcon}
          tone="emerald"
        />
        <ColoredTile
          href="/dashboard/links"
          title="Smart Links"
          subtitle="Manage your links"
          icon={BadgeDollarSign}
          tone="indigo"
        />
        <ColoredTile
          href="/dashboard/merchants"
          title="Explore Merchants"
          subtitle="Policies, payouts, and rules"
          icon={Store}
          tone="blue"
        />
        <ColoredTile
          href="/dashboard/merchants/ai"
          title="AI Suggestions (beta)"
          subtitle="Heuristic trending offers"
          icon={Sparkles}
          tone="purple"
        />
        <ColoredTile
          href="/dashboard/earnings"
          title="Earnings"
          subtitle="Commissions & performance"
          icon={Coins}
          tone="yellow"
        />
        <ColoredTile
          href="/dashboard/payouts"
          title="Payouts"
          subtitle="History & accounts"
          icon={Wallet}
          tone="rose"
        />
        <ColoredTile
          href="/dashboard/referrals"
          title="Referrals"
          subtitle="Invite friends · 5% bonus"
          icon={Gift}
          tone="green"
        />
        <ColoredTile
          href="/dashboard/settings"
          title="Settings"
          subtitle="Manage your account"
          icon={Settings}
          tone="emerald"
        />
      </div>
    </main>
  );
}
