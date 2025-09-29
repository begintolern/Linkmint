// app/layout.tsx
import "@/lib/ops/initWatchdog";
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import MarketSwitcher from "./components/MarketSwitcher";

export const metadata: Metadata = {
  title: "linkmint.co",
  description:
    "Share real deals. Get real payouts. Linkmint connects you with approved merchants who pay when your friends buy.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read cookies server-side (set by your login route)
  const store = cookies();
  const email = store.get("email")?.value || null; // presence means "logged in"
  const roleCookie = store.get("role")?.value ?? "user";
  const role = roleCookie.toLowerCase(); // normalize to avoid case mismatch

  return (
    <html lang="en">
      <body className="bg-white text-gray-900">
        {/* 🔹 Market switcher banner (cookie override for PH/US) */}
        <MarketSwitcher />

        <Header isLoggedIn={!!email} isAdmin={role === "admin"} />
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
    <header className="border-b bg-white">
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
      <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
        <p className="leading-tight">
          © {new Date().getFullYear()} linkmint.co · All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/tos" className="hover:underline">
            Terms of Service
          </Link>
          {/* <Link href="/privacy" className="hover:underline">Privacy Policy</Link> */}
          <span className="text-gray-400">·</span>
          <span className="leading-tight">
            Payouts are released only after merchants pay Linkmint. Voided
            commissions are not payable. Expect up to 90 days.
          </span>
        </div>
      </div>
    </footer>
  );
}
