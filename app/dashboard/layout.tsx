import Link from "next/link";
import type { ReactNode } from "react";
import LogoutButton from "@/components/dashboard/LogoutButton"; // client component

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky top bar; mobile-friendly and scroll-safe */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="w-full">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="h-14 flex items-center justify-between">
              {/* Brand (wrapped so it never gets clipped) */}
              <div className="flex items-center gap-2 min-w-0 shrink-0">
                <Link
                  href="/dashboard"
                  className="text-base sm:text-lg font-semibold text-teal-700 truncate"
                >
                  linkmint.co
                </Link>
              </div>

              {/* Right side on mobile: compact actions */}
              <div className="flex items-center gap-2 sm:hidden shrink-0">
                <Link
                  href="/dashboard/links"
                  className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50"
                >
                  Links
                </Link>
                <LogoutButton />
              </div>

              {/* Desktop nav */}
              <nav className="hidden sm:flex items-center gap-6 shrink-0">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-900 hover:text-teal-700 transition-colors"
                >
                  Overview
                </Link>

                <Link
                  href="/dashboard/discover"
                  className="text-sm font-medium text-gray-900 hover:text-teal-700 transition-colors"
                >
                  Discover (AI-assisted)
                </Link>

                <Link
                  href="/dashboard/earnings"
                  className="text-sm font-medium text-gray-900 hover:text-teal-700 transition-colors"
                >
                  Earnings
                </Link>

                <Link
                  href="/dashboard/links"
                  className="text-sm font-medium text-gray-900 hover:text-teal-700 transition-colors"
                >
                  Links
                </Link>

                <Link
                  href="/dashboard/referrals"
                  className="text-sm font-medium text-gray-900 hover:text-teal-700 transition-colors"
                >
                  Referrals
                </Link>

                <Link
                  href="/trust-center"
                  className="text-sm font-medium text-gray-900 hover:text-teal-700 transition-colors"
                >
                  Trust Center
                </Link>

                <Link
                  href="/dashboard/settings"
                  className="text-sm font-medium text-gray-900 hover:text-teal-700 transition-colors"
                >
                  Settings
                </Link>

                <LogoutButton />
              </nav>
            </div>

            {/* Mobile subnav: scrollable pills */}
            <div className="sm:hidden -mx-4 border-t border-gray-200">
              <div className="overflow-x-auto no-scrollbar">
                <div className="flex gap-2 px-4 py-2">
                  <Link
                    href="/dashboard"
                    className="whitespace-nowrap px-3 py-1.5 text-xs rounded-full border font-medium text-gray-900 hover:bg-gray-50"
                  >
                    Overview
                  </Link>

                  <Link
                    href="/dashboard/discover"
                    className="whitespace-nowrap px-3 py-1.5 text-xs rounded-full border font-medium text-gray-900 hover:bg-gray-50"
                  >
                    Discover (AI-assisted)
                  </Link>

                  <Link
                    href="/dashboard/earnings"
                    className="whitespace-nowrap px-3 py-1.5 text-xs rounded-full border font-medium text-gray-900 hover:bg-gray-50"
                  >
                    Earnings
                  </Link>

                  <Link
                    href="/dashboard/links"
                    className="whitespace-nowrap px-3 py-1.5 text-xs rounded-full border font-medium text-gray-900 hover:bg-gray-50"
                  >
                    Links
                  </Link>

                  <Link
                    href="/dashboard/referrals"
                    className="whitespace-nowrap px-3 py-1.5 text-xs rounded-full border font-medium text-gray-900 hover:bg-gray-50"
                  >
                    Referrals
                  </Link>

                  <Link
                    href="/trust-center"
                    className="whitespace-nowrap px-3 py-1.5 text-xs rounded-full border font-medium text-gray-900 hover:bg-gray-50"
                  >
                    Trust Center
                  </Link>

                  <Link
                    href="/dashboard/settings"
                    className="whitespace-nowrap px-3 py-1.5 text-xs rounded-full border font-medium text-gray-900 hover:bg-gray-50"
                  >
                    Settings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Page body */}
      <main className="flex-1 px-4 sm:px-6 py-6">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
