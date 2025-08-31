// app/dashboard/layout.tsx
import Link from "next/link";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="rounded-xl border bg-white p-4 md:sticky md:top-4 h-fit">
            <h2 className="text-sm font-semibold text-gray-600 mb-2">Dashboard</h2>
            <nav className="flex flex-col gap-1 text-sm">
              <Link className="rounded px-3 py-2 hover:bg-gray-100" href="/dashboard">
                Overview
              </Link>
              <Link className="rounded px-3 py-2 hover:bg-gray-100" href="/dashboard/links">
                Smart Links
              </Link>
              <Link className="rounded px-3 py-2 hover:bg-gray-100" href="/dashboard/referrals">
                Referrals
              </Link>
              <Link className="rounded px-3 py-2 hover:bg-gray-100" href="/dashboard/earnings">
                Earnings
              </Link>
              <Link className="rounded px-3 py-2 hover:bg-gray-100" href="/dashboard/payouts">
                Payouts
              </Link>
              <div className="h-px bg-gray-200 my-2" />
              <Link className="rounded px-3 py-2 hover:bg-gray-100" href="/settings">
                Settings
              </Link>
            </nav>
          </aside>

          {/* Main content */}
          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </div>
  );
}
