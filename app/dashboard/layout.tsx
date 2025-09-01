// app/dashboard/layout.tsx
import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`rounded px-3 py-2 transition ${
        active
          ? "bg-gray-900 text-white font-medium"
          : "hover:bg-gray-100 text-gray-700"
      }`}
    >
      {label}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="rounded-xl border bg-white p-4 md:sticky md:top-4 h-fit">
            <h2 className="text-sm font-semibold text-gray-600 mb-2">Dashboard</h2>
            <nav className="flex flex-col gap-1 text-sm">
              <NavLink href="/dashboard" label="Overview" />
              <NavLink href="/dashboard/links" label="Smart Links" />
              <NavLink href="/dashboard/referrals" label="Referrals" />
              <NavLink href="/dashboard/earnings" label="Earnings" />
              <NavLink href="/dashboard/payouts" label="Payouts" />
              <div className="h-px bg-gray-200 my-2" />
              <NavLink href="/settings" label="Settings" />
            </nav>
          </aside>

          {/* Main content */}
          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </div>
  );
}
