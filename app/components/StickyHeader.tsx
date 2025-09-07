"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function StickyHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll(); // set initial state
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "fixed top-0 left-0 right-0 z-50 border-b transition-all",
        // frosted glass with blur (graceful fallback)
        "bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60",
        scrolled ? "shadow-sm" : "shadow-none",
      ].join(" ")}
    >
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        {/* Logo on left */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Linkmint logo"
            width={40}
            height={40}
            priority
          />
        </Link>

        {/* Nav on right */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/trust-center" className="hover:text-slate-600">
            Trust Center
          </Link>
          <Link href="/faq" className="hover:text-slate-600">
            FAQ
          </Link>
          <Link href="/login" className="hover:text-slate-600">
            Login
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-white"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
