"use client";

import { useEffect, useState } from "react";

export default function AutoPayoutStatusCard() {
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/get-auto-payout-setting", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch setting");
      setValue(Boolean(data.value));
    } catch (e: any) {
      setErr(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function toggle() {
    if (saving) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/auto-payout-toggle", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Toggle failed");
      // refresh value
      await load();
    } catch (e: any) {
      setErr(e.message || "Toggle failed");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="border rounded-md p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Auto Payouts</h3>
          <p className="text-sm text-gray-500">
            Status:{" "}
            <span className={value ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
              {loading ? "…" : value ? "ON" : "OFF"}
            </span>
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={loading || saving}
          className="px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          {saving ? "Working…" : value ? "Turn OFF" : "Turn ON"}
        </button>
      </div>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </div>
  );
}
