"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type TrendPoint = { id: string; timestamp: string };
type TrendResponse = { ok: boolean; trend?: TrendPoint[]; error?: string };

export default function LinksCard() {
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchTrend = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/links-trend", { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as TrendResponse;
      if (!json.ok) throw new Error(json.error || "Unknown error");
      setTrend(json.trend ?? []);
    } catch (e: any) {
      setError(
        e?.message?.includes("401")
          ? "You’re not signed in. Please log in to view recent links."
          : e?.message || "Failed to load recent links."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // initial + on refresh
  useEffect(() => {
    fetchTrend();
  }, [fetchTrend, refreshKey]);

  // compress timestamps to HH:mm or day label
  const data = useMemo(() => {
    // Show at most 20 points; newest last
    const sorted = [...trend].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const trimmed = sorted.slice(-20);

    return trimmed.map((p) => {
      const d = new Date(p.timestamp);
      const label =
        trimmed.length > 12
          ? `${d.getMonth() + 1}/${d.getDate()}`
          : `${d.getHours().toString().padStart(2, "0")}:${d
              .getMinutes()
              .toString()
              .padStart(2, "0")}`;
      return { label, clicks: 1 };
    });
  }, [trend]);

  const totalClicks = useMemo(
    () => (trend ? trend.length : 0),
    [trend]
  );

  const onRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <section className="card">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold">
            Your recent links
          </h2>
          <p className="text-xs text-gray-500">
            Live click trend from your latest shortlinks
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="btn-secondary text-xs sm:text-sm"
            onClick={onRefresh}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <Link
            href="/dashboard/links"
            className="btn-primary text-xs sm:text-sm"
          >
            Manage
          </Link>
        </div>
      </div>

      {/* Body */}
      <div className="mt-3">
        {/* Error state */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 text-sm">
            {error}
          </div>
        )}

        {/* Loading state */}
        {!error && loading && (
          <div className="h-32 grid place-items-center text-sm text-gray-500">
            Loading…
          </div>
        )}

        {/* Empty state */}
        {!error && !loading && data.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            No recent clicks yet. Create a{" "}
            <Link href="/dashboard/create-link" className="underline">
              smart link
            </Link>{" "}
            and share it to start tracking.
          </div>
        )}

        {/* Chart + KPI */}
        {!error && !loading && data.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-5">
            {/* KPI */}
            <div className="order-2 sm:order-1 sm:col-span-2">
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500">Total recent clicks</div>
                <div className="text-2xl font-semibold">{totalClicks}</div>
                <div className="mt-2 text-xs text-gray-500">
                  Last {Math.min(20, trend.length)} events
                </div>
              </div>
            </div>
            {/* Chart */}
            <div className="order-1 sm:order-2 sm:col-span-3">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data}
                    margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
                  >
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                    />
                    <Tooltip
                      formatter={(v: any) => [`${v} click${v === 1 ? "" : "s"}`, "Events"]}
                      labelClassName="text-xs"
                    />
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
