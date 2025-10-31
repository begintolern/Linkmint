// app/dashboard/create-link/CreateLinkClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CreateResponse =
  | { ok: true; id: string; shortUrl?: string; merchant?: string }
  | { ok: false; error?: string; message?: string };

const PH_MERCHANTS = [
  // Lazada PH
  {
    hostIncludes: "lazada.com.ph",
    id: "cmfvvoxsj0000oij8u4oadeo5",
    name: "Lazada PH",
  },
  // Shopee PH
  {
    hostIncludes: "shopee.ph",
    id: "cmfu940920003oikshotzltnp",
    name: "Shopee",
  },
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
  const [info, setInfo] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

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
      // IMPORTANT: use the singular route we actually have: /api/smartlink/create
      const res = await fetch("/api/smartlink/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // send session cookie
        body: JSON.stringify({
          merchantId: merchant.id,
          destinationUrl: productUrl,
          source: "dashboard",
        }),
      });

      // The API returns JSON (either ok:true or ok:false)
      const data = (await res.json()) as CreateResponse;

      if (!res.ok || !("ok" in data) || data.ok === false) {
        const msg =
          ("message" in data && data.message) ||
          ("error" in data && data.error) ||
          "Failed to create link.";
        setError(msg);
        return;
      }

      // Success
      setInfo(
        data.shortUrl
          ? `Link created! Short URL: ${data.shortUrl}`
          : `Link created! ID: ${data.id}`
      );

      // Small delay so user sees the success message, then go to Links
      setTimeout(() => router.push("/dashboard/links"), 600);
    } catch (err: any) {
      console.error("create link error", err);
      setError("Network error while creating the link.");
    } finally {
      setBusy(false);
    }
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
      {info && <div className="text-green-700 text-sm">{info}</div>}

      <div className="text-xs opacity-70">
        Supported now: <b>Lazada PH</b> and <b>Shopee PH</b>. We auto-detect the
        merchant and send <code>merchantId</code>, <code>destinationUrl</code>,
        and <code>source</code> to the API.
      </div>
    </div>
  );
}
