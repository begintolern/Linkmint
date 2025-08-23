// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminHome() {
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState<boolean | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function fetchStatus() {
    setErr(null);
    try {
      // read current flag via your setting (we’ll just hit the toggle endpoint harmlessly as a GET-like check)
      const res = await fetch("/api/admin/auto-payout-set", { method: "POST", body: JSON.stringify({ value }) });
      // not ideal for read; if you add a GET later, swap to that. For now we’ll assume false on first load.
    } catch {
      /* ignore */
    }
  }

  async function toggleAutoPayout() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/auto-payout-toggle", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || "Toggle failed");
      setValue(!!json.value);
    } catch (e: any) {
      setErr(e?.message || "Server error");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    // on first load we won’t know; after first toggle, state will reflect the value
    // you can add a read-only GET later; for now we’ll leave as “unknown” until user clicks.
    setValue(null);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <Link href="/" className="text-sm rounded-lg border px-3 py-1.5 hover:bg-neutral-50">
          ← Back to site
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/users" className="rounded-xl border p-4 hover:bg-neutral-50">
          <div className="text-lg font-medium">Users</div>
          <div className="text-sm text-neutral-600">View verification status & details</div>
        </Link>

        <button
          onClick={toggleAutoPayout}
          disabled={busy}
          className="text-left rounded-xl border p-4 hover:bg-neutral-50 disabled:opacity-60"
        >
          <div className="text-lg font-medium">Auto Payouts</div>
          <div className="text-sm text-neutral-600">
            {value === null ? "Unknown (click to toggle)" : value ? "On" : "Off"}
          </div>
        </button>
      </div>

      {err && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-red-700 text-sm">{err}</div>
      )}
    </div>
  );
}
