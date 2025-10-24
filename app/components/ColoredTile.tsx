// app/components/ColoredTile.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  title: string;
  subtitle?: string;
  emoji?: string;
  tone?: "blue" | "green" | "purple" | "yellow" | "rose" | "indigo" | "emerald";
};

const toneMap: Record<NonNullable<Props["tone"]>, string> = {
  blue: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  green: "bg-green-50 border-green-200 hover:bg-green-100",
  purple: "bg-purple-50 border-purple-200 hover:bg-purple-100",
  yellow: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100",
  rose: "bg-rose-50 border-rose-200 hover:bg-rose-100",
  indigo: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
  emerald: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
};

export default function ColoredTile({
  href,
  title,
  subtitle,
  emoji,
  tone = "emerald",
}: Props) {
  const toneClasses = toneMap[tone] ?? toneMap.emerald;

  return (
    <motion.div
      whileHover={{ scale: 1.03, rotateZ: 0.5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <Link
        href={href}
        className={cn(
          "block rounded-2xl border p-4 shadow-sm transition",
          "focus:outline-none focus:ring-2 focus:ring-black/10",
          toneClasses
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold">{title}</div>
            {subtitle && (
              <div className="mt-1 text-xs text-gray-700">{subtitle}</div>
            )}
          </div>
          {emoji && <div className="text-xl">{emoji}</div>}
        </div>
      </Link>
    </motion.div>
  );
}
