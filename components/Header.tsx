// components/Header.tsx
"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  // Simple nav items — no client session checks; auth is handled server-side
  const nav = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/earnings", label: "Earnings" },
    { href: "/dashboard/links", label: "Links" },
    { href: "/dashboard/referrals", label: "Referrals" },
  ];

  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Left: brand */}
        <div className="text-sm text-gray-500 hidden sm:block">linkmint.co</div>

        {/* Center: title */}
        <Link href="/dashboard" className="text-lg font-semibold text-teal-700">
          Linkmint
        </Link>

        {/* Right: nav & logout */}
        <div className="flex items-center gap-4">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-sm transition-colors ${
                pathname?.startsWith(n.href)
                  ? "text-teal-700 font-medium"
                  : "text-gray-600 hover:text-teal-700"
              }`}
            >
              {n.label}
            </Link>
          ))}

          <button
            className="rounded-md bg-red-500 px-3 py-1.5 text-white text-sm hover:bg-red-600"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
