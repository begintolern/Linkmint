// app/components/TopNav.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

export default function TopNav({
  isLoggedIn,
  isAdmin,
}: {
  isLoggedIn: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Fixed top bar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-teal-700">
            linkmint.co
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
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
                <Link href="/logout" className="hover:underline text-red-600">
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

          {/* Mobile burger */}
          <button
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden p-2 rounded hover:bg-gray-100 active:bg-gray-200"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" fill="none">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>

        {/* Mobile menu (slide-down) */}
        <div
          className={`md:hidden overflow-hidden transition-[max-height] duration-200 ${
            open ? "max-h-48" : "max-h-0"
          }`}
        >
          <nav className="px-4 pb-3 pt-2 flex flex-col gap-2 text-sm bg-white">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="py-2 border-b" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/merchants"
                  className="py-2 border-b"
                  onClick={() => setOpen(false)}
                >
                  Merchants
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="py-2 border-b" onClick={() => setOpen(false)}>
                    Admin
                  </Link>
                )}
                <Link href="/logout" className="py-2 text-red-600" onClick={() => setOpen(false)}>
                  Logout
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="py-2 border-b" onClick={() => setOpen(false)}>
                  Login
                </Link>
                <Link href="/signup" className="py-2" onClick={() => setOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
