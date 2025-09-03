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
  Percent,
} from "lucide-react";

type Item = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const items: Item[] = [
  { href: "/dashboard", label: "Overview", Icon: LayoutDashboard },
  { href: "/dashboard/links", label: "Smart Links", Icon: Link2 },
  { href: "/dashboard/earnings", label: "Earnings", Icon: DollarSign },
  { href: "/dashboard/payouts", label: "Payouts", Icon: Wallet },
  { href: "/dashboard/referrals", label: "Referrals 5% Bonus", Icon: Percent },
  { href: "/settings", label: "Settings", Icon: Settings },
];

// Simple tooltip on hover using Tailwind (no extra libs)
function NavItem({ href, label, Icon, active }: Item & { active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group relative rounded px-3 py-2 flex items-center gap-2 transition ${
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
      <span className="truncate">{label}</span>

      {/* Tooltip bubble (hidden until hover) */}
      <span
        className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2
                   scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100
                   transition bg-gray-900 text-white text-xs rounded px-2 py-1 shadow
                   whitespace-nowrap"
      >
        {label}
        {/* small arrow */}
        <span
          className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-gray-900"
          aria-hidden
        />
      </span>
    </Link>
  );
}

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 text-sm">
      {items.map(({ href, label, Icon }) => {
        const active =
          pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
        return (
          <NavItem
            key={href}
            href={href}
            label={label}
            Icon={Icon}
            active={!!active}
          />
        );
      })}
    </nav>
  );
}
