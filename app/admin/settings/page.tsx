"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { useEffect, useState } from "react";

type ToggleResp = { success: boolean; enabled?: boolean; error?: string };

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [autoPayout, setAutoPayout] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch("/api/admin/auto-payout-toggle", { cache: "no-store" });
      const json: ToggleResp = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      setAutoPayout(!!json.enabled);
    } catch (e: any) {
      setErr(e.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function setToggle(next: boolean) {
    try {
      setBusy(true);
      setErr(null);
      const res = await fetch("/api/admin/auto-payout-toggle", {
        method: "POST", // changed from PATCH to POST
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const json: ToggleResp = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      setAutoPayout(!!json.enabled);
    } catch (e: any) {
      setErr(e.message || "Failed to update setting");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Admin · Settings</h1>
        <p className="text-sm text-slate-600 mt-1">
          Core platform toggles and thresholds
        </p>
      </header>

      {err && (
        <div className="rounded-xl bg-red-50 text-red-800 ring-1 ring-red-200 p-3 text-sm">
          {err}
        </div>
      )}

      {/* Auto Payout */}
      <section className="rounded-xl border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Auto Payout Engine</div>
            <div className="text-sm text-slate-600">
              When enabled, approved commissions (and eligible users) are paid automatically.
            </div>
          </div>
          <span className="text-xs rounded-md border px-2 py-0.5">
            {loading || autoPayout === null ? "…" : autoPayout ? "ENABLED" : "DISABLED"}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            disabled={busy || loading || autoPayout === true}
            onClick={() => setToggle(true)}
            className="text-sm rounded-md px-3 py-2 ring-1 ring-emerald-300 disabled:opacity-50 hover:bg-emerald-50"
          >
            Enable
          </button>
          <button
            disabled={busy || loading || autoPayout === false}
            onClick={() => setToggle(false)}
            className="text-sm rounded-md px-3 py-2 ring-1 ring-red-300 disabled:opacity-50 hover:bg-red-50"
          >
            Disable
          </button>
          <button
            disabled={busy || loading}
            onClick={load}
            className="text-sm rounded-md px-3 py-2 ring-1 ring-zinc-300 disabled:opacity-50 hover:bg-zinc-50"
          >
            Refresh
          </button>
        </div>
      </section>
    </main>
  );
}
