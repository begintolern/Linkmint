// app/dashboard/create-link/CreateLinkClient.tsx
"use client";

import { useState } from "react";

type CreateResponse =
  | { ok: true; id: string; shortUrl?: string; merchant?: string }
  | { ok: false; error?: string; message?: string };

const PH_MERCHANTS = [
  { hostIncludes: "lazada.com.ph", id: "cmfvvoxsj0000oij8u4oadeo5", name: "Lazada PH" },
  { hostIncludes: "shopee.ph",     id: "cmfu940920003oikshotzltnp", name: "Shopee"     },
];

function detectMerchant(urlStr: string) {
  try {
    const u = new URL(urlStr);
    const host = u.hostname.toLowerCase();
    for (const m of PH_MERCHANTS) {
      if (host.includes(m.hostIncludes)) return m;
    }
    return null;
  } catch {
    return null;
  }
}

export default function CreateLinkClient() {
  const [productUrl, setProductUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const url = productUrl.trim();
    if (!url) {
      setError("Please paste a product URL.");
      return;
    }

    const merchant = detectMerchant(url);
    if (!merchant) {
      setError("We only support Lazada PH and Shopee PH URLs for now.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/smartlinks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          merchantId: merchant.id,
          destinationUrl: url,
          source: "dashboard",
        }),
      });

      let data: CreateResponse;
      try {
        data = (await res.json()) as CreateResponse;
      } catch {
        setError("Unexpected server response.");
        return;
      }

      if (!res.ok || !("ok" in data) || data.ok === false) {
        const msg =
          ("message" in data && data.message) ||
          ("error" in data && data.error) ||
          "Failed to create link.";
        setError(msg);
        return;
      }

      // Save to localStorage "recent-links" (keep last 10)
      try {
        const raw = localStorage.getItem("recent-links");
        const arr = raw ? JSON.parse(raw) : [];
        const list: any[] = Array.isArray(arr) ? arr : [];
        const entry = {
          id: data.id,
          shortUrl: data.shortUrl ?? "",
          merchant: data.merchant ?? merchant.name,
          destinationUrl: url,
          createdAt: Date.now(),
        };
        list.unshift(entry);
        localStorage.setItem("recent-links", JSON.stringify(list.slice(0, 10)));

        // notify compact list to refresh immediately
        window.dispatchEvent(new Event("lm-recent-links-changed"));
      } catch (err) {
        console.error("localStorage save error", err);
      }

      setInfo(
        data.shortUrl
          ? `Link created! Short URL: ${data.shortUrl}`
          : `Link created! ID: ${data.id}`
      );
      // Optional: clear field
      // setProductUrl("");
    } catch (err) {
      console.error("create link error", err);
      setError("Network error while creating the link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      {/* Header removed to avoid duplication with page header */}

      <form onSubmit={handleCreate} className="space-y-3">
        <input
          type="url"
          value={productUrl}
          onChange={(e) => setProductUrl(e.target.value)}
          placeholder="https://www.lazada.com.ph/products/..."
          className="w-full rounded border px-3 py-2"
          required
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {busy ? "Creating..." : "Create Link"}
        </button>
      </form>

      {error && <div className="text-red-600 text-sm">{error}</div>}
      {info && <div className="text-green-700 text-sm">{info}</div>}
    </div>
  );
}
