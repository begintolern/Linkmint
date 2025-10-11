// components/UserMenu.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function UserMenu() {
  const { data } = useSession();
  const name = data?.user?.name || data?.user?.email || "Account";
  const initial = (name || "?").slice(0, 1).toUpperCase();
  const [open, setOpen] = useState(false);

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
