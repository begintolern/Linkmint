// app/dashboard/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import Link from "next/link";

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

  // Pure server-rendered tiles (no client components, no icons/motion)
  const tiles = [
    { href: "/dashboard/create-link", title: "Create Smart Link", subtitle: "Generate a tracked, compliant link", tone: "emerald" },
    { href: "/dashboard/links",       title: "Smart Links",       subtitle: "Manage your links",                 tone: "indigo"  },
    { href: "/dashboard/merchants",   title: "Explore Merchants", subtitle: "Policies, payouts, rules",          tone: "blue"    },
    { href: "/dashboard/merchants/ai",title: "AI Suggestions (beta)", subtitle: "Heuristic trending offers",     tone: "purple"  },
    { href: "/dashboard/earnings",    title: "Earnings",          subtitle: "Commissions & performance",         tone: "yellow"  },
    { href: "/dashboard/payouts",     title: "Payouts",           subtitle: "History & accounts",                tone: "rose"    },
    { href: "/dashboard/referrals",   title: "Referrals",         subtitle: "Invite friends · 5% bonus",         tone: "green"   },
    { href: "/dashboard/settings",    title: "Settings",          subtitle: "Manage your account",               tone: "emerald" },
  ] as const;

  const toneClass = (tone: string) => {
    switch (tone) {
      case "emerald": return "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700";
      case "blue":    return "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700";
      case "purple":  return "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700";
      case "yellow":  return "bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700";
      case "rose":    return "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700";
      case "indigo":  return "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700";
      case "green":   return "bg-green-50 hover:bg-green-100 border-green-200 text-green-700";
      default:        return "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800";
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <DashboardPageHeader
        title="Overview"
        subtitle={`Welcome back, ${name}! Manage your links, merchants, and payouts.`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map(t => (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-black/10 ${toneClass(t.tone)}`}
          >
            <h3 className="text-base font-semibold">{t.title}</h3>
            <p className="mt-1 text-sm opacity-80">{t.subtitle}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
