"use client";

import { useEffect, useState } from "react";

type CommissionItem = {
  id: string;
  amount: number;
  status: string;
  type: string | null;
  source: string | null;
  description: string | null;
  createdAt: string; // ISO
};

type ApiResponse =
  | { success: true; items: CommissionItem[] }
  | { success: false; error: string };

type MerchantSummary = {
  label: string;
  total: number;
};

export default function MerchantImpactCard() {
  const [data, setData] = useState<MerchantSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/user/commissions/recent", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        const json = (await res.json()) as ApiResponse;
        if (cancelled) return;

        if (!res.ok || !("success" in json) || !json.success) {
          setError(
            (json as any)?.error || "Could not load merchant impact."
          );
          setData(null);
          return;
        }

        const items = json.items || [];
        const map = new Map<string, number>();

        for (const item of items) {
          const label =
            extractMerchantLabel(item) || "Other merchants";

          const prev = map.get(label) ?? 0;
          map.set(label, prev + Number(item.amount || 0));
        }

        const list: MerchantSummary[] = Array.from(map.entries())
          .map(([label, total]) => ({ label, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 4);

        setData(list);
        setError(null);
      } catch {
        if (!cancelled) {
          setError("Could not load merchant impact.");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Merchant impact
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Which merchants are generating your recent commissions.
          </p>
        </div>
      </header>

      {loading && (
        <p className="text-[11px] text-slate-500">Loading…</p>
      )}

      {!loading && error && (
        <p className="text-[11px] text-rose-500">{error}</p>
      )}

      {!loading && !error && (!data || data.length === 0) && (
        <p className="text-[11px] text-slate-500">
          No merchant impact yet. Once you earn commissions, your top
          merchants will appear here.
        </p>
      )}

      {!loading && !error && data && data.length > 0 && (
        <ul className="mt-2 space-y-2 text-[11px]">
          {data.map((row) => {
            const max = data[0]?.total || 1;
            const pct = Math.max(
              6,
              Math.round((row.total / max) * 100)
            );

            return (
              <li key={row.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">
                    {row.label}
                  </span>
                  <span className="text-slate-700">
                    ₱{row.total.toFixed(2)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-teal-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function extractMerchantLabel(item: CommissionItem): string | null {
  // Prefer explicit source if it looks like a merchant
  if (item.source && item.source.trim().length > 0) {
    return item.source.trim();
  }

  // Try to read from description, e.g. "Shopee order XYZ via Involve Asia"
  const d = item.description?.toLowerCase() || "";
  if (d.includes("shopee")) return "Shopee";
  if (d.includes("lazada")) return "Lazada";
  if (d.includes("charles")) return "Charles & Keith";
  if (d.includes("havaianas")) return "Havaianas";
  if (d.includes("zalora")) return "Zalora";
  if (d.includes("shein")) return "SHEIN";
  if (d.includes("aliexpress")) return "AliExpress";

  return null;
}
