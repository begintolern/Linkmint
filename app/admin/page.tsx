// app/admin/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const tabs = [
  { key: "users",     label: "Users",     href: "/admin/users",     desc: "All users, verification & flags" },
  { key: "referrals", label: "Referrals", href: "/admin/referrals", desc: "Invites, bonuses, batches" },
  { key: "payouts",   label: "Payouts",   href: "/admin/payouts",   desc: "Approvals, status, providers" },
  { key: "logs",      label: "Logs",      href: "/admin/logs",      desc: "System & event logs" },
  { key: "settings",  label: "Settings",  href: "/admin/settings",  desc: "Toggles, trust, providers" },
];

export default async function AdminHomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?next=/admin");

  const sess = session as any;
const role = String(sess?.user?.role ?? "USER")
  if (String(role).toUpperCase() !== "ADMIN") {
    redirect("/login?next=/admin");
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin</h1>
        <span className="rounded-full border px-3 py-1 text-xs text-slate-600">
          Role: {String(role).toUpperCase()}
        </span>
      </header>

      {/* Tabs */}
      <nav className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link key={t.key} href={t.href} className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50">
            {t.label}
          </Link>
        ))}
      </nav>

      {/* Cards */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tabs.map((t) => (
          <Link key={t.key} href={t.href} className="rounded-lg border p-5 transition hover:shadow-sm">
            <div className="text-base font-semibold">{t.label}</div>
            <div className="mt-1 text-sm text-slate-600">{t.desc}</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
