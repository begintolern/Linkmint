"use client";

import React from "react";

type Provider = "PAYPAL" | "PAYONEER";

type PayoutRow = {
  id: string;
  createdAt: string;
  provider: string;
  statusEnum: "PENDING" | "PROCESSING" | "PAID" | "FAILED";
  netCents?: number;
};

function formatUSD(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
}

// parse "2", "2.00", "$2.00", "2,00" → 2.00
function parseAmountToNumber(v: string) {
  const cleaned = v.replace(/[^\d.,]/g, "").replace(/,/g, ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

export default function CashOutCard() {
  const [provider, setProvider] = React.useState<Provider>("PAYPAL");
  const [amountStr, setAmountStr] = React.useState("");
  const [available, setAvailable] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [requesting, setRequesting] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const [last, setLast] = React.useState<PayoutRow | null>(null);

  const loadAvailable = React.useCallback(async () => {
    try {
      const r = await fetch("/api/payouts/available", { cache: "no-store" });
      const j = await r.json();
      if (r.ok && j?.success) {
        // API returns a number of USD (sum of approved, unpaid commissions)
        setAvailable(typeof j.available === "number" ? j.available : 0);
      } else {
        setAvailable(0);
      }
    } catch {
      setAvailable(0);
    }
  }, []);

  const loadLast = React.useCallback(async () => {
    try {
      // Try pending first; if none, show most recent of any status
      const rp = await fetch("/api/payouts/list?status=PENDING", { cache: "no-store" });
      const jp = await rp.json();
      if (rp.ok && jp?.ok && Array.isArray(jp.rows) && jp.rows.length > 0) {
        // newest first not guaranteed; pick latest by createdAt
        const latest = [...jp.rows].sort(
          (a: PayoutRow, b: PayoutRow) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        setLast(latest);
        return;
      }

      const r = await fetch("/api/payouts/list", { cache: "no-store" });
      const j = await r.json();
      if (r.ok && j?.ok && Array.isArray(j.rows) && j.rows.length > 0) {
        const latest = [...j.rows].sort(
          (a: PayoutRow, b: PayoutRow) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        setLast(latest);
      } else {
        setLast(null);
      }
    } catch {
      setLast(null);
    }
  }, []);

  React.useEffect(() => {
    setLoading(true);
    Promise.all([loadAvailable(), loadLast()]).finally(() => setLoading(false));
  }, [loadAvailable, loadLast]);

  async function onRequestPayout() {
    const amt = parseAmountToNumber(amountStr);
    if (!amt || amt <= 0) {
      alert("Amount must be a positive number");
      return;
    }
    setRequesting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/payouts/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, amount: amt }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || "Request failed");

      setMsg("Payout requested!");
      setAmountStr("");              // ✅ reset amount field
      await Promise.all([loadAvailable(), loadLast()]); // refresh data
    } catch (e: any) {
      alert(e.message || "Failed to request payout");
    } finally {
      setRequesting(false);
    }
  }

  const youWillReceive =
    (() => {
      const amt = parseAmountToNumber(amountStr);
      if (!amt || amt <= 0) return null;
      // You can show fees later; for now show same amount
      return amt;
    })() ?? null;

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm space-y-4">
      <h3 className="text-lg font-semibold">Cash Out Anytime</h3>

      <div className="text-sm text-gray-700">
        <div>
          <span className="font-medium">Available:&nbsp;</span>
          {loading ? "…" : formatUSD(available ?? 0)}
        </div>
        {last && (
          <div className="mt-1 text-gray-600">
            <span className="font-medium">Last request:&nbsp;</span>
            {new Date(last.createdAt).toLocaleString()} • {last.statusEnum}
            {typeof last.netCents === "number" ? (
              <> • ${((last.netCents || 0) / 100).toFixed(2)}</>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3">
        <div className="flex-1">
          <label className="text-sm font-medium">Provider</label>
          <select
            className="border rounded px-2 py-2 w-full"
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
          >
            <option value="PAYPAL">PayPal</option>
            <option value="PAYONEER">Payoneer</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium">Amount (USD)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            className="border rounded px-3 py-2 w-full"
            placeholder="e.g. 2.00"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
          />
          {youWillReceive != null && (
            <div className="text-xs text-gray-600 mt-1">
              You will receive approximately <span className="font-medium">${youWillReceive.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div>
          <button
            onClick={onRequestPayout}
            disabled={requesting || !amountStr}
            className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
          >
            {requesting ? "Requesting…" : "Request Payout"}
          </button>
        </div>
      </div>

      {msg && <p className="text-sm text-green-700">{msg}</p>}

      <p className="text-xs text-gray-500">
        Payouts are processed after commissions clear with the network. Timing varies by merchant.
      </p>
    </div>
  );
}
