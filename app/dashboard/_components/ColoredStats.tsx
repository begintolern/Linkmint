"use client";

type Stat = {
  label: string;
  value: string;
  sub?: string;
  bg: string;      // Tailwind background
  fg: string;      // Tailwind foreground (text)
  ring: string;    // Tailwind ring color
};

const CARDS: Stat[] = [
  { label: "Pending",      value: "$0.00",   sub: "Awaiting network approval", bg: "bg-amber-500",  fg: "text-amber-950",  ring: "ring-amber-600/40" },
  { label: "Approved",     value: "$0.00",   sub: "Cleared to payout",         bg: "bg-emerald-500",fg: "text-emerald-950",ring: "ring-emerald-600/40" },
  { label: "Paid",         value: "$0.00",   sub: "Total sent to you",         bg: "bg-sky-500",    fg: "text-sky-950",    ring: "ring-sky-600/40" },
  { label: "Clicks (24h)", value: "0",       sub: "Last 24 hours",             bg: "bg-indigo-500", fg: "text-indigo-950", ring: "ring-indigo-600/40" },
  { label: "Conversions",  value: "0",       sub: "Valid orders",              bg: "bg-fuchsia-500",fg: "text-fuchsia-950", ring: "ring-fuchsia-600/40" },
  { label: "Reversals",    value: "0",       sub: "Refunded/voided",           bg: "bg-rose-500",   fg: "text-rose-950",   ring: "ring-rose-600/40" },
];

export default function ColoredStats() {
  return (
    <section className="rounded-2xl border bg-white p-4 md:p-5">
      <div className="mb-3 text-sm font-medium text-gray-800">Overview</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <div
            key={c.label}
            className={`rounded-xl p-4 ring-1 ${c.bg} ${c.fg} ${c.ring} shadow-sm`}
          >
            <div className="text-xs/5 opacity-90">{c.label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</div>
            {c.sub ? <div className="mt-1 text-xs/5 opacity-80">{c.sub}</div> : null}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Note: These are placeholder values. Your real stats populate from the backend
        (Pending → Approved → Paid) once commissions clear with the affiliate network.
      </p>
    </section>
  );
}
