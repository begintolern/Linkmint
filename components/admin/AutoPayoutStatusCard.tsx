"use client";

import { useEffect, useState } from "react";

type StatusResp =
  | { success: true; value: boolean }
  | { success: false; error: string };

export default function AutoPayoutStatusCard() {
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [enabled, setEnabled] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch("/api/admin/auto-payout-toggle/status", { cache: "no-store" });
      const json: StatusResp = await res.json();
      if (!res.ok || !("success" in json) || !json.success) {
        throw new Error(("error" in json && json.error) || `HTTP ${res.status}`);
      }
      setEnabled(json.value);
    } catch (e: any) {
      setErr(e.message || "Failed to load status");
    } finally {
      setLoading(false);
    }
  }

  async function toggle() {
    try {
      setToggling(true);
      setErr(null);
      // optimistic flip
      setEnabled((v) => !v);
      const res = await fetch("/api/admin/auto-payout-toggle", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setEnabled(!!json.value);
    } catch (e: any) {
      // revert optimistic flip on error
      setEnabled((v) => !v);
      setErr(e.message || "Failed to toggle");
    } finally {
      setToggling(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="rounded-2xl ring-1 ring-zinc-200 p-5 bg-white/70 dark:bg-zinc-900/70">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">Payout Engine</div>
          <h2 className="text-xl font-semibold mt-1">Auto Payouts</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">
            When enabled, approved commissions are queued automatically for payout.
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={loading || toggling}
          className="rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-zinc-300 dark:ring-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
        >
          {toggling ? "Toggling…" : enabled ? "Turn Off" : "Turn On"}
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span
          className={`inline-flex h-2 w-2 rounded-full ${
            loading ? "bg-zinc-300 animate-pulse" : enabled ? "bg-emerald-500" : "bg-zinc-400"
          }`}
        />
        <span className="text-sm">
          {loading ? "Checking status…" : enabled ? "Auto payouts are ON" : "Auto payouts are OFF"}
        </span>
      </div>

      {err && (
        <div className="mt-3 rounded-lg bg-red-50 text-red-800 ring-1 ring-red-200 p-2 text-sm">{err}</div>
      )}

      <div className="mt-3">
        <button
          onClick={load}
          disabled={loading}
          className="text-xs rounded-lg px-2 py-1 ring-1 ring-zinc-300 hover:bg-zinc-50"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
