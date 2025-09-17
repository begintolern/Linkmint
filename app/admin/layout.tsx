// app/admin/layout.tsx
"use client";

import "@/app/globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";

function Item({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`block rounded px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-black text-white"
          : "text-gray-800 hover:bg-gray-100"
      }`}
    >
      {label}
    </Link>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 border-r bg-white flex flex-col">
        <div className="p-4 font-semibold">Admin</div>
        <nav className="px-3 space-y-1">
          <Item href="/admin/users" label="Users" />
          <Item href="/admin/referrals" label="Referrals" />
          <Item href="/admin/payouts" label="Payouts" />
          <Item href="/admin/merchant-rules" label="Merchant Rules" />
          <Item href="/admin/logs" label="Logs" />
          <Item href="/admin/settings" label="Settings" />
        </nav>
        {/* No logout here; only in Dashboard sidebar per your preference */}
      </aside>

      <main className="flex-1 px-6 py-6">{children}</main>
    </div>
  );
}
