// components/dashboard/TrendingSmartItem.tsx
"use client";

import { useState } from "react";

type Item = {
  id: string;
  title: string;
  merchant: string;
  price: number;
  image?: string;
  url: string;
};

async function tryCreateSmartlink(originalUrl: string) {
  const candidates = [
    { ep: "/api/smartlink", body: { url: originalUrl } },          // ✅ your existing working route
    { ep: "/api/smart-links/generate", body: { url: originalUrl } },
    { ep: "/api/links/create", body: { url: originalUrl } },
    { ep: "/api/smartlinks/create", body: { url: originalUrl } },
    { ep: "/api/linkmint/shorten", body: { url: originalUrl } },
  ];

  for (const { ep, body } of candidates) {
    try {
      const res = await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) continue;
      const j = await res.json();
      const short =
        j?.link ||
        j?.shortUrl ||
        j?.url ||
        j?.data?.shortUrl ||
        j?.data?.url ||
        j?.slug;
      if (short && typeof short === "string") return short;
    } catch {
      // try next candidate silently
    }
  }
  return null;
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function TrendingSmartItem({ item }: { item: Item }) {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function handleGenerate() {
    setLoading(true);
    setToast(null);
    setLink(null);

    const short = await tryCreateSmartlink(item.url);
    setLoading(false);

    if (!short) {
      showToast("Couldn’t generate link. Check smartlink API route.");
      return;
    }

    setLink(short);
    const ok = await copy(short);
    showToast(ok ? "Smartlink copied ✅" : "Link ready — click Copy.");
  }

  async function handleCopy() {
    if (!link) return;
    const ok = await copy(link);
    showToast(ok ? "Copied ✅" : "Copy failed");
  }

  return (
    <div className="relative rounded-xl border p-3 hover:shadow transition">
      {toast && (
        <div className="absolute right-3 top-3 rounded-lg border bg-white px-3 py-1.5 text-xs shadow">
          {toast}
        </div>
      )}

      <div className="aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="mt-2 text-sm font-medium line-clamp-2">
        {item.title}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        ₱{Intl.NumberFormat("en-PH").format(item.price)} ·{" "}
        {item.merchant === "LAZADA_PH"
          ? "Lazada"
          : item.merchant === "SHOPEE_PH"
          ? "Shopee"
          : item.merchant}
      </div>

      {!link ? (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`mt-3 w-full rounded-lg border text-sm py-2 transition ${
            loading
              ? "bg-gray-200 text-gray-500"
              : "bg-black text-white hover:bg-gray-800"
          }`}
        >
          {loading ? "Generating…" : "Get Smartlink"}
        </button>
      ) : (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={link}
              className="w-full rounded-lg border px-3 py-2 text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              onClick={handleCopy}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
              title="Copy to clipboard"
            >
              Copy
            </button>
          </div>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-blue-600 hover:underline"
          >
            Open smartlink →
          </a>
        </div>
      )}
    </div>
  );
}
