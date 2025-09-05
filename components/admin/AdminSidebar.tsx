"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin/users",     label: "Users" },
  { href: "/admin/referrals", label: "Referrals" },
  { href: "/admin/payouts",   label: "Payouts" },
  { href: "/admin/logs",      label: "Logs" },
  { href: "/admin/settings",  label: "Settings" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav className="rounded-xl border p-2">
      <div className="px-3 py-2 text-xs font-medium text-slate-500">Admin</div>
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
    </nav>
  );
}
