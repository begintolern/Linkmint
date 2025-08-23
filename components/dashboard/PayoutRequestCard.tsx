"use client";

import { useEffect, useState } from "react";

type Provider = "PAYPAL" | "PAYONEER";

export default function PayoutRequestCard() {
  const [provider, setProvider] = useState<Provider>("PAYPAL");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<{ feeCents: number; netCents: number } | null>(null);
  const amountCents = Math.round(((parseFloat(amount) || 0) * 100));

  useEffect(() => {
    let ignore = false;
    async function run() {
      if (amountCents <= 0) return setQuote(null);
      const res = await fetch("/api/payouts/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents, provider }),
      });
      const json = await res.json();
      if (!ignore && json.success) setQuote({ feeCents: json.feeCents, netCents: json.netCents });
    }
    run();
    return () => { ignore = true; };
  }, [amountCents, provider]);

  const fmt = (c: number) => `$${(c / 100).toFixed(2)}`;

  async function requestPayout() {
    const res = await fetch("/api/payouts/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents, provider }),
    });
    const json = await res.json();
    if (!json.success) alert(json.error || "Request failed");
    else {
      alert("Payout requested!");
      setAmount("");
      setQuote(null);
    }
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
      <h3 className="text-lg font-semibold">Cash Out Anytime</h3>

      <div className="flex gap-3 items-center">
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
          className="border rounded px-2 py-2"
        >
          <option value="PAYPAL">PayPal</option>
          <option value="PAYONEER">Payoneer</option>
        </select>

        <input
          className="border rounded px-3 py-2 w-40"
          placeholder="Amount (USD)"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      {quote && (
        <div className="text-sm text-gray-700">
          <div>Requested: <strong>{fmt(amountCents)}</strong></div>
          <div>Fee: <strong>{fmt(quote.feeCents)}</strong></div>
          <div>You will receive: <strong>{fmt(quote.netCents)}</strong></div>
          <p className="mt-2 text-xs text-gray-500">
            No minimum payout. Provider fees (PayPal/Payoneer) are deducted.
          </p>
        </div>
      )}

      <button
        onClick={requestPayout}
        disabled={!amountCents}
        className="rounded bg-black text-white px-3 py-2 disabled:opacity-50"
      >
        Request Payout
      </button>
    </div>
  );
}
