// app/admin/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function Item({ href, label }: { href: string; label: string }) {
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0 bg-teal-900 text-teal-100 flex md:flex-col border-b md:border-b-0 md:border-r border-teal-800">
        <div className="p-4 text-white font-semibold flex-1 md:flex-none">
          Admin
        </div>

        <nav className="px-3 pb-3 md:pb-0 md:space-y-1 flex-1 md:flex-none flex gap-2 overflow-x-auto md:block">
          <Item href="/admin" label="Overview" />
          <Item href="/admin/commissions" label="Commissions" />
          <Item href="/admin/payouts" label="Payouts" />
          <Item href="/admin/payout-logs" label="Payout Logs" />
          <Item href="/admin/merchant-rules" label="Merchant Rules" />
          <Item href="/admin/ops" label="Ops & Health" />
          <Item href="/admin/settings" label="Settings" />
          <Item href="/admin/activity" label="Activity" />
          <Item href="/admin/logs" label="Logs" />
          <Item href="/admin/users" label="Users" />
          <Item href="/tools/policy-check" label="Policy Pre-Check (AI)" />
        </nav>

        {/* Logout */}
        <div className="hidden md:block mt-auto p-4">
          <Link
            href="/logout"
            className="block w-full text-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Logout
          </Link>
        </div>
      </aside>

      {/* Mobile logout bar */}
      <div className="md:hidden border-t border-teal-800 bg-teal-900 px-4 py-2">
        <Link
          href="/logout"
          className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 text-center"
        >
          Logout
        </Link>
      </div>

      {/* Main content */}
      <main className="flex-1 px-3 py-4 md:px-6 md:py-6 overflow-x-auto">
        {children}
      </main>
    </div>
  );
}
