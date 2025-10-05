// app/layout.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import "@/lib/ops/initWatchdog";
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import MarketSwitcher from "./components/MarketSwitcher";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "linkmint.co",
  description:
    "Share real deals. Get real payouts. Linkmint connects you with approved merchants who pay when your friends buy.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = cookies();

  const email = store.get("email")?.value || null;
  const uid =
    store.get("uid")?.value ||
    store.get("userId")?.value ||
    null;

  let role = (store.get("role")?.value ?? "user").toLowerCase();

  try {
    if (uid) {
      const u = await prisma.user.findUnique({
        where: { id: uid },
        select: { role: true },
      });
      if (u?.role) role = String(u.role).toLowerCase();
    } else if (email) {
      const u = await prisma.user.findUnique({
        where: { email },
        select: { role: true },
      });
      if (u?.role) role = String(u.role).toLowerCase();
    }
  } catch {
    // Fallback to cookie role if DB unavailable
  }

  return (
    <html lang="en">
      <body className="bg-white text-gray-900">
        <MarketSwitcher />
        <Header isLoggedIn={!!(email || uid)} isAdmin={role === "admin"} />
        <div className="min-h-[76vh]">{children}</div>
        <Footer />
      </body>
    </html>
  );
}

function Header({
  isLoggedIn,
  isAdmin,
}: {
  isLoggedIn: boolean;
  isAdmin: boolean;
}) {
  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-bold text-xl text-teal-700">
          linkmint.co
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>
              <Link href="/dashboard/merchants" className="hover:underline">
                Merchants
              </Link>
              {isAdmin && (
                <Link href="/admin" className="hover:underline">
                  Admin
                </Link>
              )}
              <Link href="/logout" className="hover:underline">
                Logout
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Login
              </Link>
              <Link href="/signup" className="hover:underline">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
        <p className="leading-tight">
          © {new Date().getFullYear()} linkmint.co · All rights reserved.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:gap-4">
          {/* English links */}
          <div className="flex items-center gap-3">
            <a href="/tos" className="hover:underline">Terms</a>
            <span className="text-gray-400">·</span>
            <a href="/privacy" className="hover:underline">Privacy</a>
            <span className="text-gray-400">·</span>
            <a href="/dashboard/trust-center" className="hover:underline">Trust Center</a>
          </div>

          {/* Tagalog links */}
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-gray-400 hidden sm:inline">|</span>
            <span className="text-gray-500">🇵🇭</span>
            <a href="/tos/tl" className="hover:underline">Mga Tuntunin</a>
            <span className="text-gray-400">·</span>
            <a href="/privacy/tl" className="hover:underline">Privacy (TL)</a>
            <span className="text-gray-400">·</span>
            <a href="/dashboard/trust-center/tl" className="hover:underline">Sentro ng Tiwala</a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-6 text-xs text-gray-500">
        Payouts are released only after merchants pay Linkmint. Voided commissions are not
        payable. Expect up to 90 days.
      </div>
    </footer>
  );
}
