// app/components/MobileNav.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((v) => !v);

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/merchants", label: "Merchants" },
    { href: "/dashboard/payouts", label: "Payouts" },
    { href: "/dashboard/referrals", label: "Referrals" },
  ];

  return (
    <nav className="md:hidden border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="flex items-center justify-between p-3">
        <span className="font-bold text-lg">linkmint.co</span>
        <button
          onClick={toggle}
          className="p-2 rounded-md hover:bg-gray-100"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <IconX /> : <IconMenu />}
        </button>
      </div>

      {open && (
        <div className="flex flex-col border-t bg-white">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="px-4 py-3 border-b hover:bg-gray-50"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

function IconMenu() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M6 6l12 12M18 6l-12 12"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
