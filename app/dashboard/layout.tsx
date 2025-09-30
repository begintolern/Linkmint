// app/dashboard/layout.tsx
"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function Item({
  href,
  label,
  onSelect,
}: {
  href: string;
  label: string;
  onSelect?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      onClick={onSelect}
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
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /**
   * Global site header (from app/layout.tsx) sits at the top.
   * Its height ~56px (py-3). We place our mobile bar *below* it: top-14 (56px).
   * Then we add extra padding to main content on mobile so nothing is hidden.
   */
  const GLOBAL_HEADER_H = "top-14"; // 56px
  const MOBILE_MAIN_PT = "pt-32";   // ~128px (header 56 + bar 56 + spacing)

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

      {/* Mobile top bar (＜ md) — placed BELOW global header */}
      <div className={`md:hidden fixed inset-x-0 z-40 border-b bg-white ${GLOBAL_HEADER_H}`}>
        <div className="flex items-center justify-between px-4 h-14">
          <button
            aria-label="Open menu"
            className="rounded-md border px-3 py-1.5 text-sm"
            onClick={() => setOpen(true)}
          >
            Menu
          </button>
          <Link href="/" className="font-semibold text-teal-700">
            linkmint.co
          </Link>
          <div className="w-[54px]" />
        </div>
      </div>

      {/* Mobile drawer + overlay — also start BELOW global header */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-0 z-50 ${GLOBAL_HEADER_H} ${open ? "" : "pointer-events-none"}`}
      >
        {/* Dim background (only below global header) */}
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
        {/* Drawer */}
        <aside
          className={`absolute left-0 top-0 bottom-0 w-64 bg-teal-900 text-teal-100 border-r border-teal-800 transform transition-transform ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
        >
          <div className="p-4 flex items-center justify-between">
            <div className="text-white font-semibold">Dashboard</div>
            <button
              aria-label="Close menu"
              className="rounded-md border border-teal-700 px-2 py-1 text-sm text-white hover:bg-teal-800"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
          <nav className="px-3 space-y-1">
            <Item href="/dashboard" label="Overview" onSelect={() => setOpen(false)} />
            <Item href="/dashboard/links" label="Smart Links" onSelect={() => setOpen(false)} />
            <Item href="/dashboard/earnings" label="Earnings" onSelect={() => setOpen(false)} />
            <Item href="/dashboard/payouts" label="Payouts" onSelect={() => setOpen(false)} />
            <Item href="/dashboard/referrals" label="Referrals 5% Bonus" onSelect={() => setOpen(false)} />
            <Item href="/dashboard/trust-center" label="Trust Center" onSelect={() => setOpen(false)} />
            <Item href="/dashboard/settings" label="Settings" onSelect={() => setOpen(false)} />
          </nav>
          <div className="mt-auto p-4">
            <Link
              href="/logout"
              className="block w-full text-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
              onClick={() => setOpen(false)}
            >
              Logout
            </Link>
          </div>
        </aside>
      </div>

      {/* Main content: extra top padding on mobile to clear BOTH bars */}
      <main className={`flex-1 px-4 md:px-6 py-6 md:pt-6 ${MOBILE_MAIN_PT}`}>{children}</main>
    </div>
  );
}
