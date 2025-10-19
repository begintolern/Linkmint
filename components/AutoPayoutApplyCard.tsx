// components/AutoPayoutApplyCard.tsx
"use client";

import { useState } from "react";

export default function AutoPayoutApplyCard() {
  const [adminKey, setAdminKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [explainSkips, setExplainSkips] = useState(true); // NEW: default ON
  const [out, setOut] = useState<string>("");

  async function runApply() {
    setBusy(true);
    setOut("");
    try {
      const r = await fetch("/api/admin/cron/auto-payout-apply", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(adminKey ? { "x-admin-key": adminKey } : {}),
        },
        body: JSON.stringify({
          reason: "admin_manual_click",
          explainSkips,         // NEW: send to API
          // (optional) add limit here if you want a fixed batch size:
          // limit: 20,
        }),
      });
      const ct = r.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await r.json();
        setOut(JSON.stringify(j, null, 2));
      } else {
        const t = await r.text();
        setOut(t);
      }
    } catch (e: any) {
      setOut(`{ "ok": false, "error": ${JSON.stringify(e?.message || String(e))} }`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">Auto-Payout Apply (manual)</h3>
      <p className="mt-1 text-xs text-gray-600">
        Runs the auto-payout engine once. Safe in DRY RUN (no disburse).
      </p>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs">
          <span className="mb-1 block text-gray-600">x-admin-key</span>
          <input
            type="password"
            placeholder="Required"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </label>

        <label className="flex items-end gap-2 text-xs">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            checked={explainSkips}
            onChange={(e) => setExplainSkips(e.target.checked)}
          />
          <span className="mb-[2px] text-gray-700">Explain skips in result</span>
        </label>

        <div className="sm:col-span-2 flex items-end">
          <button
            onClick={runApply}
            disabled={busy || !adminKey}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? "Running..." : "Run Auto-Payout Apply"}
          </button>
        </div>
      </div>

      {out && (
        <pre className="mt-3 max-h-64 overflow-auto rounded-md bg-gray-50 p-3 text-xs text-gray-800">
{out}
        </pre>
      )}
    </div>
  );
}
