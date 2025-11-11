// components/UserMenu.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SessionLite = {
  user?: { name?: string | null; email?: string | null } | null;
};

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string>("Account");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!res.ok) throw new Error("session fetch failed");
        const j = (await res.json()) as SessionLite | null;
        const display =
          j?.user?.name ||
          j?.user?.email ||
          "Account";
        if (active) setName(display);
      } catch {
        if (active) setName("Account");
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Until we check once, render nothing (prevents UI flicker)
  if (!loaded) return null;

  const initial = (name || "?").slice(0, 1).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-9 rounded-full bg-teal-600 text-white grid place-items-center font-semibold"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 rounded-xl border bg-white shadow-lg overflow-hidden"
        >
          <div className="px-3 py-2 text-xs text-gray-500">Signed in as</div>
          <div className="px-3 pb-2 text-sm truncate">{name}</div>
          <div className="h-px bg-gray-200" />
          <Link
            href="/dashboard/settings"
            className="block px-3 py-2 text-sm hover:bg-gray-50"
            role="menuitem"
          >
            Settings
          </Link>
          <Link
            href="/logout"
            className="block px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            role="menuitem"
          >
            Logout
          </Link>
        </div>
      )}
    </div>
  );
}
