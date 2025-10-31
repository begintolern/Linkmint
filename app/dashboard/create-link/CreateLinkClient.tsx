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

    const merchant = detectMerchant(productUrl);
    if (!merchant) {
      setError("Could not detect merchant. Please use a Lazada or Shopee link.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/smartlink/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationUrl: productUrl,
          merchantName: merchant,
          source: "dashboard",
        }),
      });

      const data: CreateResponse = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to create link");

      router.push("/dashboard/smartlinks");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-xl font-semibold mb-4">Create Smart Link</h1>
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Product URL</label>
          <input
            type="url"
            required
            className="w-full border rounded-lg p-2 text-sm"
            placeholder="https://www.lazada.com.ph/product/..."
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full disabled:opacity-50"
        >
          {busy ? "Creating..." : "Create Link"}
        </button>
      </form>
    </div>
  );
}
