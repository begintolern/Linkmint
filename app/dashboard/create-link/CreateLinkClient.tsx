// app/dashboard/create-link/CreateLinkClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CreateResponse =
  | { ok: true; id: string; shortUrl?: string; merchant?: string }
  | { ok: false; error?: string; message?: string };

const PH_MERCHANTS = [
  { hostIncludes: "lazada.com.ph", id: "cmfvvoxsj0000oij8u4oadeo5", name: "Lazada PH" },
  { hostIncludes: "shopee.ph",      id: "cmfu940920003oikshotzltnp", name: "Shopee"     },
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
  const router = useRouter();
  const [productUrl, setProductUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ shortUrl?: string; id?: string; merchant?: string } | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!productUrl.trim()) {
      setError("Please paste a product URL.");
      return;
    }

    const merchant = detectMerchant(productUrl);
    if (!merchant) {
      setError("We only support Lazada PH and Shopee PH URLs for now.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/smartlink/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          merchantId: merchant.id,
          destinationUrl: productUrl,
          source: "dashboard",
        }),
      });

      const data = (await res.json()) as CreateResponse;

      if (!res.ok || data.ok === false) {
        const msg = ("message" in data && data.message) || ("error" in data && data.error) || "Failed to create link.";
        setError(msg);
        return;
      }

      // Persist success info on screen (no auto-redirect)
      setSuccess({ shortUrl: data.shortUrl, id: data.id, merchant: merchant.name });

      // Optional: stash to localStorage so the Links page (if it reads this) can show “Recent”
      try {
        const key = "lm_recent_links";
        const prev = JSON.parse(localStorage.getItem(key) || "[]");
        const now = Date.now();
        const entry = { id: data.id, shortUrl: data.shortUrl, merchant: merchant.name, createdAt: now, productUrl };
        const next = [entry, ...prev].slice(0, 10);
        localStorage.setItem(key, JSON.stringify(next));
      } catch { /* ignore storage errors */ }
    } catch (err) {
      console.error("create link error", err);
      setError("Network error while creating the link.");
    } finally {
      setBusy(false);
    }
  }

  function handleCopy() {
    if (!success?.shortUrl) return;
    navigator.clipboard.writeText(success.shortUrl).catch(() => {});
  }

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Create Smart Link (PH)</h1>
      <p className="text-sm opacity-80">
        Paste a <strong>real</strong> Lazada PH or Shopee PH product URL.
      </p>

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

      {success && (
        <div className="rounded border p-3 space-y-2">
          <div className="text-green-700 text-sm">
            Link created{success.merchant ? ` for ${success.merchant}` : ""}!
          </div>
          {success.shortUrl && (
            <div className="text-xs break-all">
              <b>Short URL: </b> {success.shortUrl}
            </div>
          )}
          <div className="flex gap-2">
            {success.shortUrl && (
              <button
                onClick={handleCopy}
                className="rounded bg-gray-200 px-3 py-1 text-sm"
              >
                Copy
              </button>
            )}
            <button
              onClick={() => router.push("/dashboard/links")}
              className="rounded bg-blue-600 px-3 py-1 text-white text-sm"
            >
              Go to My Links
            </button>
          </div>
        </div>
      )}

      <div className="text-xs opacity-70">
        Supported now: <b>Lazada PH</b> and <b>Shopee PH</b>. We auto-detect the merchant and
        send <code>merchantId</code>, <code>destinationUrl</code>, and <code>source</code> to the API.
      </div>
    </div>
  );
}
