// app/admin/page.tsx
export const dynamic = "force-dynamic";

import type { Session } from "next-auth";
import Link from "next/link";
import { assertAdmin } from "@/lib/utils/adminGuard";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

const tabs = [
  { key: "users",     label: "Users",     href: "/admin/users",     desc: "All users, verification & flags" },
  { key: "referrals", label: "Referrals", href: "/admin/referrals", desc: "Invites, bonuses, batches" },
  { key: "payouts",   label: "Payouts",   href: "/admin/payouts",   desc: "Approvals, status, providers" },
  { key: "logs",      label: "Logs",      href: "/admin/logs",      desc: "System & event logs" },
  { key: "settings",  label: "Settings",  href: "/admin/settings",  desc: "Toggles, trust, providers" },
];

export default async function AdminHomePage() {
  // Redirects away if not admin
  await assertAdmin();

  const session = (await getServerSession(authOptions)) as Session | null;
  const email = session?.user?.email ?? "admin";
  const role = (session?.user as any)?.role ?? "ADMIN";

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
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
