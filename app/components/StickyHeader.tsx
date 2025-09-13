// app/components/StickyHeader.tsx
"use client";

import Link from "next/link";

export default function StickyHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur border-b">
      <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: brand text only */}
        <Link href="/" className="flex items-center gap-3">
          <span className="font-semibold text-lg md:text-xl tracking-tight">
            linkmint.co
          </span>
        </Link>

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm hover:text-gray-800">
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center rounded-xl bg-gray-900 px-4 py-2 text-white text-sm font-medium hover:bg-black transition"
          >
            Get started — it’s free
          </Link>
        </div>
      </nav>
    </header>
  );
}
