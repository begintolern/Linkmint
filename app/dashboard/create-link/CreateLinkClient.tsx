// app/dashboard/create-link/CreateLinkClient.tsx
"use client";

import { useState } from "react";

type DetectOk = { ok: true; key: string; displayName: string };
type DetectErr = { ok: false; error: string };
type Detect = DetectOk | DetectErr;

type CreateOk = {
  ok: true;
  id: string;            // internal smartLink id OR short code
  shortUrl?: string;     // if the API returns a short url
  merchant?: string;     // optional echo
};
type CreateErr = { ok: false; error?: string; message?: string };
type CreateResp = CreateOk | CreateErr;

const KEY_V1 = "recent-links";
const KEY_V2 = "recent-links:v2";

function saveRecent(entry: {
  id: string;
  shortUrl: string;
  merchant?: string;
  destinationUrl: string;
}) {
  try {
    // v1 (legacy)
    const rawV1 = localStorage.getItem(KEY_V1);
    const listV1 = rawV1 ? (JSON.parse(rawV1) as any[]) : [];
    listV1.unshift({ ...entry, createdAt: Date.now(), pinned: false });
    localStorage.setItem(KEY_V1, JSON.stringify(listV1.slice(0, 20)));

    // v2 (preferred)
    const rawV2 = localStorage.getItem(KEY_V2);
    const listV2 = rawV2 ? (JSON.parse(rawV2) as any[]) : [];
    listV2.unshift({ ...entry, createdAt: Date.now(), pinned: false });
    localStorage.setItem(KEY_V2, JSON.stringify(listV2.slice(0, 50)));

    // notify listeners
    window.dispatchEvent(new Event("lm-recent-links-changed"));
  } catch (e) {
    console.warn("recent save failed:", e);
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

    setBusy(true);
    try {
      // 1) Detect merchant
      const detRes = await fetch(
        `/api/merchants/detect?url=${encodeURIComponent(url)}`,
        { cache: "no-store", credentials: "include" }
      );
      const det = (await detRes.json()) as Detect;

      if (!detRes.ok || !("ok" in det) || det.ok === false) {
        setError("Unsupported or invalid URL. We currently support Lazada PH and Shopee PH.");
        return;
      }

      // 2) Create smartlink with merchantKey + destinationUrl
      const createRes = await fetch("/api/smartlinks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          merchantKey: det.key,        // <-- switched from merchantId to merchantKey
          destinationUrl: url,
          source: "dashboard",
        }),
      });

      let data: CreateResp;
      try {
        data = (await createRes.json()) as CreateResp;
      } catch {
        setError("Unexpected server response.");
        return;
      }

      if (!createRes.ok || !("ok" in data) || data.ok === false) {
        const msg =
          ("message" in data && data.message) ||
          ("error" in data && data.error) ||
          "Failed to create link.";
        setError(msg);
        return;
      }

      const shortUrl = (data.shortUrl ?? "").toString();
      const id = data.id;

      // 3) Save to recent (v2 + legacy v1) so both /links and CompactRecent see it
      saveRecent({
        id,
        shortUrl,
        merchant: data.merchant || det.displayName,
        destinationUrl: url,
      });

      setInfo(
        shortUrl
          ? `Link created! Short URL: ${shortUrl}`
          : `Link created! ID: ${id}`
      );
      // keep the field for quick edits; or uncomment to clear:
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
      <form onSubmit={handleCreate} className="space-y-3">
        <input
          type="url"
          value={productUrl}
          onChange={(e) => setProductUrl(e.target.value)}
          placeholder="https://www.lazada.com.ph/products/...  or  https://shopee.ph/..."
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
