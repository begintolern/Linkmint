// app/components/StickyHeader.tsx
"use client";

import Link from "next/link";
import Image from "next/image";

export default function StickyHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur border-b">
      {/* Taller nav to fit larger logo */}
      <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          {/* Enlarged logo, removed text span */}
          <Image
            src="/logo.png"
            alt="linkmint.co"
            width={128}
            height={128}
            className="h-20 w-20 md:h-24 md:w-24"
            priority
          />
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/trust" className="text-sm hover:text-gray-700">
            Trust Center
          </Link>
          <Link href="/login" className="text-sm hover:text-gray-700">
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center rounded-xl border border-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-900 hover:text-white transition"
          >
            Sign up
          </Link>
        </div>
      </nav>
    </header>
  );
}
