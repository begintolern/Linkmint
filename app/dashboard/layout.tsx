// app/dashboard/layout.tsx
"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileNav from "@/components/MobileNav";

function Item({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`block rounded px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-teal-700 text-white"
          : "text-teal-100 hover:bg-teal-800 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar (≥ md) */}
      <aside className="hidden md:flex w-64 shrink-0 bg-teal-900 text-teal-100 flex-col border-r border-teal-800">
        <div className="p-4 text-white font-semibold">Dashboard</div>
        <nav className="px-3 space-y-1">
          <Item href="/dashboard" label="Overview" />
          <Item href="/dashboard/links" label="Smart Links" />
          <Item href="/dashboard/earnings" label="Earnings" />
          <Item href="/dashboard/payouts" label="Payouts" />
          <Item href="/dashboard/referrals" label="Referrals 5% Bonus" />
          <Item href="/dashboard/trust-center" label="Trust Center" />
          <Item href="/dashboard/settings" label="Settings" />
        </nav>
        <div className="mt-auto p-4">
          <Link
            href="/logout"
            className="block w-full text-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Logout
          </Link>
        </div>
      </aside>

      {/* Mobile nav (＜ md) — sits BELOW global header */}
      <div className="md:hidden fixed inset-x-0 top-14 z-40">
        <MobileNav />
      </div>

      {/* Main content: add margin so it clears the header + nav on mobile */}
      <main className="flex-1 px-4 md:px-6 py-6 md:pt-6 mt-28 md:mt-0">
        {children}
      </main>
    </div>
  );
}
