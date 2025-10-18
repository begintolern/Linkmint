// app/admin/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import type { Session } from "next-auth";
import Link from "next/link";
import { assertAdmin } from "@/lib/utils/adminGuard";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import AdminHeader from "@/components/AdminHeader";
import AdminHealthStatusCard from "@/components/AdminHealthStatusCard";
import { isAutoPayoutEnabled, isAutoDisburseEnabled } from "@/lib/config/flags";
import AutoPayoutStatus from "@/components/AutoPayoutStatus"; // NEW

const tabs = [
  { key: "users",     label: "Users",     href: "/admin/users",     desc: "All users, verification & flags" },
  { key: "referrals", label: "Referrals", href: "/admin/referrals", desc: "Invites, bonuses, batches" },
  { key: "payouts",   label: "Payouts",   href: "/admin/payouts",   desc: "Approvals, status, providers" },
  { key: "logs",      label: "Logs",      href: "/admin/logs",      desc: "System & event logs" },
  { key: "settings",  label: "Settings",  href: "/admin/settings",  desc: "Toggles, trust, providers" },
];

export default async function AdminHomePage() {
  await assertAdmin();

  const session = (await getServerSession(authOptions)) as Session | null;
  const email = session?.user?.email ?? "admin";
  const role = (session?.user as any)?.role ?? "ADMIN";

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <AdminHeader />

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-sm text-slate-600 mt-1">
            Signed in as <span className="font-medium">{email}</span>
          </p>
        </div>
        <span className="rounded-full border px-3 py-1 text-xs text-slate-600">
          Role: {String(role).toUpperCase()}
        </span>
      </header>

      {/* System Health */}
      <section className="mt-6">
        <AdminHealthStatusCard />
      </section>

      {/* Server-side snapshot of flags (ENV/effective at render) */}
      <section className="mt-6 border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Payout Automation Status</h2>
        <p>
          Auto-Payout:{" "}
          <span
            className={`font-bold ml-1 ${
              isAutoPayoutEnabled() ? "text-green-600" : "text-gray-500"
            }`}
          >
            {isAutoPayoutEnabled() ? "Enabled" : "Disabled"}
          </span>
        </p>
        <p>
          Auto-Disburse:{" "}
          <span
            className={`font-bold ml-1 ${
              isAutoDisburseEnabled() ? "text-green-600" : "text-gray-500"
            }`}
          >
            {isAutoDisburseEnabled() ? "Enabled" : "Disabled"}
          </span>
        </p>
      </section>

      {/* Client-side read-only status (fetches /api/admin/flags) */}
      <section className="mt-4">
        <AutoPayoutStatus />
      </section>

      {/* Tabs */}
      <nav className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50"
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {/* Cards */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className="rounded-lg border p-5 transition hover:shadow-sm"
          >
            <div className="text-base font-semibold">{t.label}</div>
            <div className="mt-1 text-sm text-slate-600">{t.desc}</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
