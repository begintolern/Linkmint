// app/dashboard/admin/finder/page.tsx
"use client";

import { useEffect, useState } from "react";

type Health = {
  ok: boolean;
  mode: "PROVISION" | "LIVE" | string;
  source: string;
  totalItems: number;
  lastUpdated: string;
};

export default function AdminFinderPage() {
  const [data, setData] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/finder/health", { cache: "no-store" });
      const json = (await res.json()) as Health | { ok: false; error?: string };
      if (!("ok" in json) || (json as any).ok !== true) {
        throw new Error((json as any)?.error || "Failed to load");
      }
      setData(json as Health);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load Finder health.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Finder Health</h1>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-xl border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Provision status and item counts for the Smart Product Finder.
      </p>

      {err && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs text-muted-foreground">Mode</div>
          <div className="mt-1">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                data?.mode === "PROVISION"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {data?.mode ?? "—"}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs text-muted-foreground">Source</div>
          <div className="mt-1 text-sm font-medium">{data?.source ?? "—"}</div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs text-muted-foreground">Total Items</div>
          <div className="mt-1 text-lg font-semibold">{data?.totalItems ?? "—"}</div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border bg-white p-4">
        <div className="text-xs text-muted-foreground">Last Updated</div>
        <div className="mt-1 text-sm">{data?.lastUpdated ?? "—"}</div>
        <p className="mt-2 text-xs text-muted-foreground">
          When you switch to live feeds (Shopee/Lazada adapters), this page will reflect
          the live item counts and refresh timestamps.
        </p>
      </div>
    </div>
  );
}
