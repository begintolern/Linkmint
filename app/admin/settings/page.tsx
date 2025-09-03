// app/admin/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminSettingsPage() {
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState<boolean | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Optional: fetch current flag if you add a GET endpoint later.
  useEffect(() => {
    setValue(null); // unknown until toggled
  }, []);

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

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin · Settings</h1>
        <Link href="/admin" className="text-sm rounded-lg border px-3 py-1.5 hover:bg-neutral-50">
          ← Back to Admin
        </Link>
      </div>

      <section className="rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-medium">Auto Payouts</div>
            <div className="text-sm text-neutral-600">
              {value === null ? "Unknown (click to toggle)" : value ? "On" : "Off"}
            </div>
          </div>
          <button
            onClick={toggleAutoPayout}
            disabled={busy}
            className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-60"
          >
            {busy ? "Toggling…" : "Toggle"}
          </button>
        </div>

        {err && (
          <div className="mt-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-red-700 text-sm">
            {err}
          </div>
        )}
      </section>
    </main>
  );
}
