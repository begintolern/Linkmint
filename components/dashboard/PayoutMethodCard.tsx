"use client";

import { useEffect, useState } from "react";

type Provider = "PAYPAL" | "PAYONEER";

export default function PayoutMethodCard() {
  const [provider, setProvider] = useState<Provider>("PAYPAL");
  const [externalId, setExternalId] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [cashAmount, setCashAmount] = useState<string>("");

  // NEW: Load existing default payout and prefill
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/payout-account", { cache: "no-store" });
        const json = await res.json();
        if (!json) return;

        // Support either shape: {account:{...}} or {data:{...}}
        const acct = json.account ?? json.data ?? null;
        if (acct) {
          if (acct.provider) setProvider(acct.provider as Provider);
          if (acct.externalId) setExternalId(acct.externalId);
          if (acct.label) setLabel(acct.label);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  async function onSave() {
    setSaving(true);
    setMsg(null);
    try {
      const body = {
        provider,
        // Backend may expect "email" or "externalId"; send both for compatibility.
        email: externalId,
        externalId,
        label: label || (provider === "PAYPAL" ? "Personal PayPal" : "Payoneer"),
      };

      const res = await fetch("/api/payout-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed");

      setMsg("Saved! This is now your default payout method.");

      // IMPORTANT: Do NOT clear externalId; keep it visible so it looks retained.
      // setExternalId("");
      // setLabel("");
    } catch (e: any) {
      setMsg(e.message || "Error saving payout method.");
    } finally {
      setSaving(false);
    }
  }

  async function onCashOut() {
    if (!cashAmount || Number(cashAmount) <= 0) {
      alert("Amount must be a positive number");
      return;
    }
    try {
      const res = await fetch("/api/payouts/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          amount: Number(cashAmount),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed");
      alert("Payout requested!");
      setCashAmount(""); // reset input after success
    } catch (e: any) {
      alert(e.message || "Error requesting payout.");
    }
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
      <h3 className="text-lg font-semibold">Payout Method</h3>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Provider</label>
        <select
          className="border rounded px-2 py-2"
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
        >
          <option value="PAYPAL">PayPal</option>
          <option value="PAYONEER">Payoneer</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          {provider === "PAYPAL" ? "PayPal Email" : "Payoneer Recipient ID or Email"}
        </label>
        <input
          className="border rounded px-3 py-2"
          placeholder={provider === "PAYPAL" ? "you@paypal.com" : "Recipient ID or email"}
          value={externalId}
          onChange={(e) => setExternalId(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Label (optional)</label>
        <input
          className="border rounded px-3 py-2"
          placeholder={provider === "PAYPAL" ? "Personal PayPal" : "Payoneer Business"}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>

      {msg && <p className="text-sm">{msg}</p>}

      <button
        onClick={onSave}
        disabled={saving || !externalId}
        className="rounded bg-black text-white px-3 py-2 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save as Default"}
      </button>

      <p className="text-xs text-gray-500">
        This will be set as your default payout destination. You can change it anytime.
      </p>

      {/* Cash Out Section */}
      <div className="mt-6 border-t pt-4">
        <h4 className="text-md font-semibold mb-2">Cash Out Anytime</h4>
        <div className="flex items-center gap-2">
          <select
            className="border rounded px-2 py-2"
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
          >
            <option value="PAYPAL">PayPal</option>
            <option value="PAYONEER">Payoneer</option>
          </select>
          <input
            type="number"
            className="border rounded px-3 py-2 w-32"
            placeholder="Amount (USD)"
            value={cashAmount}
            onChange={(e) => setCashAmount(e.target.value)}
          />
          <button onClick={onCashOut} className="rounded bg-gray-800 text-white px-3 py-2">
            Request Payout
          </button>
        </div>
      </div>
    </div>
  );
}
