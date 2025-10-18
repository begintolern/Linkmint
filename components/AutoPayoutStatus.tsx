// components/AutoPayoutStatus.tsx
"use client";

import { useEffect, useState } from "react";

type Snapshot = {
  ok: boolean;
  env: { autoPayoutEnabled: boolean; autoPayoutDisburseEnabled: boolean };
  effective: { autoPayoutEnabled: boolean; autoPayoutDisburseEnabled: boolean };
  overrides: { autoPayoutEnabled: boolean | null; autoPayoutDisburseEnabled: boolean | null };
};

export default function AutoPayoutStatus() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [adminKey, setAdminKey] = useState("");

  async function load() {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/flags", {
        headers: { ...(adminKey ? { "x-admin-key": adminKey } : {}) },
      });
      const j = await r.json();
      setSnap(j);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eff = snap?.effective;
  const env = snap?.env;

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Auto-Payout Status (read-only)</h3>
        <button
          onClick={load}
          disabled={busy}
          className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-xs">
          <span className="mb-1 block text-gray-600">x-admin-key</span>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Required to read API"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </label>

        <div className="text-xs text-gray-700">
          <div className="mb-1">
            <span className="font-medium">Auto-Payout (effective): </span>
            <span className={eff?.autoPayoutEnabled ? "text-green-600" : "text-gray-500"}>
              {String(eff?.autoPayoutEnabled ?? false).toUpperCase()}
            </span>
          </div>
          <div className="mb-1">
            <span className="font-medium">Auto-Disburse (effective): </span>
            <span className={eff?.autoPayoutDisburseEnabled ? "text-green-600" : "text-gray-500"}>
              {String(eff?.autoPayoutDisburseEnabled ?? false).toUpperCase()}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-gray-500">
            ENV → payout={String(env?.autoPayoutEnabled)} • disburse={String(env?.autoPayoutDisburseEnabled)}
          </div>
        </div>
      </div>
    </div>
  );
}
