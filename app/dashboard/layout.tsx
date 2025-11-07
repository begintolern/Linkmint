"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  async function handleLogout() {
    // Properly sign out and redirect to landing page
    await signOut({ callbackUrl: "/", redirect: true });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
        <Link href="/dashboard" className="text-lg font-semibold text-teal-700">
          linkmint.co
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-teal-700 transition-colors"
          >
            Overview
          </Link>
          <Link
            href="/dashboard/earnings"
            className="text-sm text-gray-600 hover:text-teal-700 transition-colors"
          >
            Earnings
          </Link>
          <Link
            href="/dashboard/referrals"
            className="text-sm text-gray-600 hover:text-teal-700 transition-colors"
          >
            Referrals
          </Link>
          <Link
            href="/dashboard/payout-methods"
            className="text-sm text-gray-600 hover:text-teal-700 transition-colors"
          >
            Payouts
          </Link>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Logout
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
