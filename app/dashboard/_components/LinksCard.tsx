"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type SafeLink = {
  id: string;
  shortUrl: string | null;
  merchantName: string | null;
  destinationUrl: string | null;
  createdAt: string; // ISO
  clicks: number;
};

type TrendPoint = { date: string; count: number };
type TrendMap = Record<string, TrendPoint[]>; // linkId -> series

async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path, { method: "GET", cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default function LinksCard() {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<SafeLink[]>([]);
  const [trends, setTrends] = useState<TrendMap>({});
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const data = await apiGet<{ ok: boolean; links: SafeLink[] }>("/api/links");
    if (!data?.ok) {
      setErr("Can’t reach the links API.");
      setLinks([]);
      setTrends({});
      setLoading(false);
      return;
    }
    const top = data.links.slice(0, 6);
    setLinks(top);

    // Fetch trends for the visible link IDs (gracefully optional)
    const ids = top.map((l) => l.id).join(",");
    const trendResp = await apiGet<{ ok: boolean; trends: TrendMap }>(`/api/links-trend?ids=${encodeURIComponent(ids)}`);
    if (trendResp?.ok && trendResp.trends) {
      setTrends(trendResp.trends);
    } else {
      setTrends({});
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const content = useMemo(() => {
    if (loading) {
      return <div className="p-6 text-sm text-gray-500">Loading…</div>;
    }
    if (err) {
      return <div className="p-6 text-sm text-amber-800 bg-amber-50 border-t border-amber-100">{err}</div>;
    }
    if (links.length === 0) {
      return (
        <div className="p-6 text-sm text-gray-500">
          No links yet.{" "}
          <Link href="/dashboard/create-link" className="text-teal-700 hover:underline font-medium">
            Create your first link
          </Link>
          .
        </div>
      );
    }

    return (
      <ul className="divide-y divide-gray-100">
        {links.map((l) => {
          const series = trends[l.id] ?? [];
          return (
            <li key={l.id} className="px-5 py-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-gray-300" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="truncate">
                      <div className="text-sm font-medium text-gray-800 truncate">{l.merchantName ?? "—"}</div>
                      <a
                        href={l.destinationUrl ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-xs text-gray-600 hover:text-teal-700 hover:underline"
                        title={l.destinationUrl ?? ""}
                      >
                        {l.destinationUrl ?? "—"}
                      </a>
                    </div>
                    <div className="text-right shrink-0">
                      <a
                        href={l.shortUrl ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-teal-700 hover:underline"
                      >
                        {l.shortUrl ? l.shortUrl.replace(/^https?:\/\//, "") : "—"}
                      </a>
                      <div className="text-[11px] text-gray-500">
                        Clicks: <span className="font-medium text-gray-700">{l.clicks}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mini trend (last 7 days if available) */}
                  {series.length > 0 && (
                    <div className="mt-2 h-16 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={series}>
                          <XAxis dataKey="date" hide />
                          <YAxis hide />
                          <Tooltip
                            formatter={(v: any) => [`${v} clicks`, ""]}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                          <Line type="monotone" dataKey="count" dot={false} strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }, [loading, err, links, trends]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">Your recent links</h3>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/links" className="text-xs text-teal-700 hover:underline">
            View all
          </Link>
          <button
            type="button"
            onClick={load}
            className="text-xs rounded-lg border px-3 py-1 hover:bg-gray-50 active:bg-gray-100"
            title="Refresh"
          >
            Refresh
          </button>
        </div>
      </div>
      {content}
    </div>
  );
}
