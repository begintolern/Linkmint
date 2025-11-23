// app/dashboard/discover/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function DiscoverLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Fix: ensure pathname is always a string (not null)
  const pathnameRaw = usePathname();
  const pathname = pathnameRaw || "";

  const isMerchants = pathname.startsWith("/dashboard/discover/merchants");
  const isIdeas =
    pathname === "/dashboard/discover" ||
    pathname === "/dashboard/discover/";

  return (
    <div className="flex-1">
      {/* Top tab bar (sits above the page content) */}
      <div className="border-b border-slate-800 bg-slate-950 px-4 pt-4 sm:px-6 sm:pt-5">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-teal-200">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
            <span>Discover</span>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-800"
          >
            ← Back to overview
          </Link>
        </div>

        <div className="mx-auto mt-3 max-w-5xl">
          <nav className="-mb-px flex gap-4 text-sm">
            <TabLink
              href="/dashboard/discover"
              label="Ideas"
              active={isIdeas && !isMerchants}
            />
            <TabLink
              href="/dashboard/discover/merchants"
              label="Browse merchants"
              active={isMerchants}
            />
          </nav>
        </div>
      </div>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}

function TabLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`border-b-2 px-1 pb-2 text-xs sm:text-sm transition-colors ${
        active
          ? "border-teal-400 text-teal-100"
          : "border-transparent text-slate-400 hover:text-teal-100 hover:border-slate-500"
      }`}
    >
      {label}
    </Link>
  );
}
