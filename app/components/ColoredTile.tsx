"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface Props {
  href: string;
  title: string;
  subtitle: string;
  tone?: "emerald" | "blue" | "purple" | "yellow" | "rose" | "indigo" | "green";
  icon?: LucideIcon;
}

const toneMap: Record<string, string> = {
  emerald: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700",
  blue:    "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700",
  purple:  "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700",
  yellow:  "bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700",
  rose:    "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700",
  indigo:  "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700",
  green:   "bg-green-50 hover:bg-green-100 border-green-200 text-green-700",
};

export default function ColoredTile({ href, title, subtitle, tone = "blue", icon: Icon }: Props) {
  const toneClass = toneMap[tone] ?? toneMap.blue;

  return (
    <Link
      href={href}
      className={`flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition ${toneClass} focus:outline-none focus:ring-2 focus:ring-black/10`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
        {Icon && <Icon className="h-5 w-5 opacity-80" />}
      </div>
      <p className="mt-1 text-sm opacity-80">{subtitle}</p>
    </Link>
  );
}
