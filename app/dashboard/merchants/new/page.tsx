"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewMerchantPage() {
  const router = useRouter();
  const [merchantName, setMerchantName] = useState("");
  const [network, setNetwork] = useState("CJ");
  const [domainPattern, setDomainPattern] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [allowedRegions, setAllowedRegions] = useState("US"); // comma-separated
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!merchantName.trim()) {
      setMsg("Merchant name is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/merchant-rules/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantName,
          network,
          domainPattern,
          commissionType: "PERCENT",
          commissionRate: commissionRate ? Number(commissionRate) : null,
          allowedRegions, // API accepts comma-separated string or string[]
          notes: notes || null,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed");
      setMsg("Merchant created! Redirecting...");
      setTimeout(() => router.push("/dashboard/merchants"), 800);
    } catch (err: any) {
      setMsg(err.message || "Error creating merchant");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New Merchant</h1>
        <Link href="/dashboard/merchants" className="text-blue-600 text-sm">
          ← Back
        </Link>
      </div>

      {msg && <div className="text-sm">{msg}</div>}

      <form onSubmit={onSubmit} className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium mb-1">Merchant Name*</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
            placeholder="Groupe SEB"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Network</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            placeholder="CJ / Rakuten / Impact / Awin"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Domain Pattern</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={domainPattern}
            onChange={(e) => setDomainPattern(e.target.value)}
            placeholder="homeandcooksales.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Commission Rate (%)</label>
          <input
            type="number"
            step="0.01"
            className="w-full border rounded px-3 py-2"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            placeholder="5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Allowed Regions</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={allowedRegions}
            onChange={(e) => setAllowedRegions(e.target.value)}
            placeholder="US, CA"
          />
          <p className="text-xs text-gray-500 mt-1">Comma-separated list, e.g., US, CA</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            className="w-full border rounded px-3 py-2 min-h-[96px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Brands, promo cadence, AOV, special rules…"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border rounded bg-gray-50"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
