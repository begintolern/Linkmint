"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

const items = [
  { href: "/admin/users",     label: "Users" },
  { href: "/admin/referrals", label: "Referrals" },
  { href: "/admin/payouts",   label: "Payouts" },
  { href: "/admin/logs",      label: "Logs" },
  { href: "/admin/settings",  label: "Settings" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data } = useSession();
  const email = data?.user?.email ?? "admin";
  const [busy, setBusy] = useState(false);

  async function onLogout() {
    try {
      setBusy(true);
      await signOut({ redirect: true, callbackUrl: "/" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <nav className="rounded-xl border p-2">
      <div className="px-3 py-2 text-xs font-medium text-slate-500">Admin</div>

      <div className="px-3 pb-2 text-xs text-slate-600">
        Signed in as <span className="font-medium">{email}</span>
      </div>

      <ul className="space-y-1">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={
                  "block rounded-lg px-3 py-2 text-sm transition " +
                  (active
                    ? "bg-slate-900 text-white"
                    : "hover:bg-slate-50 text-slate-700")
                }
              >
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 border-t pt-3 px-2">
        <button
          onClick={onLogout}
          disabled={busy}
          className="w-full rounded-lg px-3 py-2 text-sm ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-50"
        >
          {busy ? "Signing out…" : "Log out"}
        </button>
      </div>
    </nav>
  );
}
