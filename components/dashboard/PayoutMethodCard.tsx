"use client";

import { useState } from "react";

type Provider = "PAYPAL" | "PAYONEER";

export default function PayoutMethodCard() {
  const [provider, setProvider] = useState<Provider>("PAYPAL");
  const [externalId, setExternalId] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSave() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/payout-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, externalId, label }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed");
      setMsg("Saved! This is now your default payout method.");
      setExternalId("");
      setLabel("");
    } catch (e: any) {
      setMsg(e.message || "Error saving payout method.");
    } finally {
      setSaving(false);
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
    </div>
  );
}
