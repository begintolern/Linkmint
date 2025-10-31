// app/dashboard/create-link/CreateLinkClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CreateResponse = {
  ok: boolean;
  id?: string;
  error?: string;
  shortUrl?: string;
  merchant?: string;
};

const PH_DOMAINS = [
  { hostIncludes: "lazada.com.ph", merchant: "Lazada PH" },
  { hostIncludes: "shopee.ph", merchant: "Shopee" },
];

function detectMerchant(urlStr: string) {
  try {
    const u = new URL(urlStr);
    const host = u.hostname.toLowerCase();
    for (const rule of PH_DOMAINS) {
      if (host.includes(rule.hostIncludes)) return rule.merchant;
    }
    return null;
  } catch {
    return null;
  }
}

export default function CreateLinkClient() {
  const router = useRouter();
  const [productUrl, setProductUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Basic URL parse
    let u: URL;
    try {
      u = new URL(productUrl);
    } catch {
      setError("Please enter a valid product URL.");
      return;
    }

    // PH-only guard: allow Lazada PH or Shopee PH only
    const merchant = detectMerchant(productUrl);
    if (!merchant) {
      setError(
        "For PH launch, only Lazada PH (lazada.com.ph) and Shopee (shopee.ph) links are allowed."
      );
      return;
    }

    setBusy(true);
    try {
      // Call your existing create-link API (adjust path if yours is different)
      const res = await fetch("/api/links/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productUrl,
          merchant, // helpful for server logs/metrics
          market: "PH",
          source: "dashboard",
        }),
      });

      const data = (await res.json()) as CreateResponse;
      if (!data.ok) {
        setError(data.error || "Failed to create link.");
        setBusy(false);
        return;
      }

      // Navigate to Links page (where “Your recent links” shows)
      router.push("/dashboard/links");
    } catch (err: any) {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Create Smart Link</h1>
      <p className="text-sm text-gray-600">
        PH-only launch: paste a product URL from{" "}
        <strong>lazada.com.ph</strong> or <strong>shopee.ph</strong>. We’ll
        auto-detect the merchant and create your smart link.
      </p>

      <form onSubmit={handleCreate} className="space-y-3">
        <label className="block text-sm font-medium">
          Product URL
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="https://www.lazada.com.ph/..."
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            disabled={busy}
            required
          />
        </label>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="rounded-md px-4 py-2 bg-black text-white disabled:opacity-60"
        >
          {busy ? "Creating..." : "Create Link"}
        </button>
      </form>

      <div className="text-xs text-gray-500">
        Tip: We currently allow only Lazada PH and Shopee during PH launch. More
        merchants are coming soon.
      </div>
    </div>
  );
}
