"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Link2,
  Users,
  DollarSign,
  Wallet,
  Settings,
} from "lucide-react";

type Item = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const items: Item[] = [
  { href: "/dashboard", label: "Overview",  Icon: LayoutDashboard },
  { href: "/dashboard/links", label: "Smart Links", Icon: Link2 },
  { href: "/dashboard/referrals", label: "Referrals", Icon: Users },
  { href: "/dashboard/earnings", label: "Earnings", Icon: DollarSign },
  { href: "/dashboard/payouts", label: "Payouts", Icon: Wallet },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 text-sm">
      {items.map(({ href, label, Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`group rounded px-3 py-2 flex items-center gap-2 transition ${
              active
                ? "bg-gray-900 text-white font-medium"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            <Icon
              className={`h-4 w-4 ${
                active ? "opacity-100" : "opacity-80 group-hover:opacity-100"
              }`}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
