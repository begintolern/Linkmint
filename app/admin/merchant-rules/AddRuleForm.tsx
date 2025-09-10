"use client";

import { useState } from "react";

export default function AddRuleForm() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // minimal fields; you can extend later
  const [merchantName, setMerchantName] = useState("");
  const [network, setNetwork] = useState("CJ");
  const [domainPattern, setDomainPattern] = useState("");
  const [cookieWindowDays, setCookieWindowDays] = useState<number | "">("");
  const [payoutDelayDays, setPayoutDelayDays] = useState<number | "">("");
  const [commissionType, setCommissionType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [commissionRate, setCommissionRate] = useState<string>(""); // keep as string for decimal
  const [allowedSources, setAllowedSources] = useState("");
  const [disallowed, setDisallowed] = useState("");
  const [notes, setNotes] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        active: true,
        merchantName: merchantName.trim(),
        network: network.trim() || null,
        domainPattern: domainPattern.trim() || null,
        cookieWindowDays: cookieWindowDays === "" ? null : Number(cookieWindowDays),
        payoutDelayDays: payoutDelayDays === "" ? null : Number(payoutDelayDays),
        commissionType,
        commissionRate: commissionRate ? commissionRate.trim() : null, // keep as string, backend accepts Decimal?
        allowedSources: allowedSources
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        disallowed: disallowed
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        notes: notes.trim() || null,
      };

      const res = await fetch("/api/admin/merchant-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.detail || j?.error || `HTTP ${res.status}`);
      }

      // refresh page to show the new rule
      window.location.reload();
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl px-4 py-2 border hover:bg-gray-50"
      >
        + Add Rule
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border p-4">
      <div className="text-lg font-medium">Add Merchant Rule</div>

      <div className="grid md:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm">Merchant Name *</span>
          <input
            className="border rounded-md px-2 py-1"
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Network</span>
          <input
            className="border rounded-md px-2 py-1"
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            placeholder="CJ / Amazon / Impact / Rakuten"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Domain Pattern</span>
          <input
            className="border rounded-md px-2 py-1"
            value={domainPattern}
            onChange={(e) => setDomainPattern(e.target.value)}
            placeholder="example.com"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Cookie Window (days)</span>
          <input
            className="border rounded-md px-2 py-1"
            type="number"
            min={0}
            value={cookieWindowDays}
            onChange={(e) =>
              setCookieWindowDays(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Payout Delay (days)</span>
          <input
            className="border rounded-md px-2 py-1"
            type="number"
            min={0}
            value={payoutDelayDays}
            onChange={(e) =>
              setPayoutDelayDays(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Commission Type</span>
          <select
            className="border rounded-md px-2 py-1"
            value={commissionType}
            onChange={(e) => setCommissionType(e.target.value as any)}
          >
            <option value="PERCENT">PERCENT</option>
            <option value="FIXED">FIXED</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">
            Commission Rate {commissionType === "PERCENT" ? "(e.g. 0.05)" : "(e.g. 4.00)"}
          </span>
          <input
            className="border rounded-md px-2 py-1"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            placeholder={commissionType === "PERCENT" ? "0.05" : "4.00"}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Allowed Sources (comma separated)</span>
        <input
          className="border rounded-md px-2 py-1"
          value={allowedSources}
          onChange={(e) => setAllowedSources(e.target.value)}
          placeholder="Content blogs, Organic social, Email (if compliant)"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Disallowed (comma separated)</span>
        <input
          className="border rounded-md px-2 py-1"
          value={disallowed}
          onChange={(e) => setDisallowed(e.target.value)}
          placeholder="No brand keyword bidding, No impersonation"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Notes</span>
        <textarea
          className="border rounded-md px-2 py-1"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      {err && <div className="text-sm text-red-600">Error: {err}</div>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md px-3 py-1.5 bg-black text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Rule"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-3 py-1.5 border"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
