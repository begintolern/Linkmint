// app/dashboard/_components/ColoredStats.tsx
"use client";

import { useEffect, useState } from "react";

type Summary = {
  pending: number;
  approved: number;
  processing: number;
  paid: number;
  failed: number;
  bonus?: {
    cents?: number;
    usd?: number;
    tier?: number;
    active?: boolean;
    eligibleUntil?: string | null;
    remainingDays?: number | null;
  };
};

export default function ColoredStats() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch("/api/user/commissions/summary", {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as Summary;
        if (!abort) setData(json);
      } catch {
        if (!abort) setError("LOAD_FAIL");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, []);

  // Single primary tone for all normal cards, one danger tone for "Failed"
  const PRIMARY_TONE =
    "bg-teal-50 border-teal-200 text-teal-900";
  const DANGER_TONE =
    "bg-rose-50 border-rose-200 text-rose-800";

  const cards = [
    {
      label: "Pending",
      value:
        data?.pending !== undefined
          ? currency(data.pending)
          : loading
          ? "—"
          : "0",
    },
    {
      label: "Approved",
      value:
        data?.approved !== undefined
          ? currency(data.approved)
          : loading
          ? "—"
          : "0",
    },
    {
      label: "Processing",
      value:
        data?.processing !== undefined
          ? currency(data.processing)
          : loading
          ? "—"
          : "0",
    },
    {
      label: "Paid",
      value:
        data?.paid !== undefined ? currency(data.paid) : loading ? "—" : "0",
    },
    {
      label: "Failed",
      value:
        data?.failed !== undefined ? currency(data.failed) : loading ? "—" : "0",
    },
    {
      label: "Bonus",
      value:
        data?.bonus
          ? data.bonus.usd !== undefined
            ? currency(data.bonus.usd)
            : data.bonus.cents !== undefined
            ? currency((data.bonus.cents || 0) / 100)
            : "0"
          : loading
          ? "—"
          : "0",
    },
  ] as const;

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => {
        const tone = c.label === "Failed" ? DANGER_TONE : PRIMARY_TONE;

        return (
          <div
            key={c.label}
            className={`rounded-2xl border p-4 shadow-sm ${tone}`}
          >
            <div className="text-xs uppercase tracking-wide opacity-70">
              {c.label}
            </div>
            <div className="mt-1 text-xl font-semibold">{c.value}</div>
            {error && c.label === "Pending" ? (
              <div className="mt-1 text-[11px] opacity-60">Couldn’t load.</div>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}

function currency(n: number) {
  // Keep it neutral (USD-style) for now; we can localize after PH/US switch is finalized.
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}
