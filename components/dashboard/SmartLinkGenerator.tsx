// components/dashboard/SmartLinkGenerator.tsx
"use client";

import { useState } from "react";

type Merchant = {
  id: string;
  merchantName: string;
  status: "PENDING" | "ACTIVE" | "REJECTED";
  active: boolean;
};

async function getMerchantByName(name: string): Promise<Merchant | null> {
  try {
    const res = await fetch("/api/public/merchants?all=true", { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const merchants: Merchant[] = json.merchants ?? [];
    const match = merchants.find(
      (m) => m.merchantName.toLowerCase() === name.trim().toLowerCase()
    );
    return match ?? null;
  } catch {
    return null;
  }
}

export default function SmartLinkGenerator() {
  const [merchantName, setMerchantName] = useState("");
  const [rawUrl, setRawUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setResultUrl(null);

    const name = merchantName.trim();
    if (!name) {
      setErr("Please enter a merchant name.");
      return;
    }
    if (!rawUrl.trim()) {
      setErr("Please paste a product/merchant URL.");
      return;
    }

    setLoading(true);
    try {
      // ✅ Check merchant status before generating
      const m = await getMerchantByName(name);
      if (!m) {
        setErr("Merchant not found. Try selecting one from the list first.");
        return;
      }
      const isActive = m.status === "ACTIVE" && m.active;
      if (!isActive) {
        setErr(
          m.status === "PENDING"
            ? "This merchant is pending approval. You’ll be able to create links once it’s approved."
            : "This merchant is not available (rejected/disabled). Please pick a different merchant."
        );
        return;
      }

      // 🔗 Call your existing API to build a Smart Link
      const res = await fetch("/api/smart-links/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantName: name,
          url: rawUrl,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to generate link");
      }
      const json = await res.json();
      setResultUrl(json?.link ?? null);
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">SmartLink Tools</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Convert product URLs into earning links. Or discover trending items to share.
      </p>

      <form onSubmit={handleGenerate} className="mt-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Merchant name</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="e.g., Shopee PH or Lazada PH"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Product / merchant URL</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Paste a product page URL to convert"
              value={rawUrl}
              onChange={(e) => setRawUrl(e.target.value)}
            />
          </div>
        </div>

        {err && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        {resultUrl && (
          <div className="break-all rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            Link created:{" "}
            <a className="underline" href={resultUrl} target="_blank" rel="noopener noreferrer">
              {resultUrl}
            </a>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            disabled={loading}
            className={`rounded-lg border px-4 py-2 ${
              loading ? "bg-gray-200 text-gray-500" : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            {loading ? "Generating..." : "Generate Smart Link"}
          </button>

          {/* Secondary action: jump to Finder */}
          <a
            href="/dashboard/finder"
            className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm hover:bg-muted"
            title="Discover trending products to share"
          >
            🔍 Find Products
          </a>
        </div>
      </form>

      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        💡 Tip: You can earn even from your own purchases (cashback for self-buys).{" "}
        <span className="font-medium">Coming soon.</span>
      </div>
    </div>
  );
}
