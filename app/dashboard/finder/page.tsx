// app/dashboard/finder/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  title: string;
  merchant: "LAZADA_PH" | "SHOPEE_PH" | string;
  price: number;
  image?: string;
  url: string;
  rating?: number;
  reviews?: number;
  tags?: string[];
};
type ApiResp = { ok: boolean; items: Item[] };

function clsx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

/** Try common shortlink endpoints; fallback to original URL if none. */
async function tryCreateSmartlink(originalUrl: string): Promise<string | null> {
  const candidates = [
    "/api/links/create",
    "/api/smartlinks/create",
    "/api/linkmint/shorten",
    "/api/smart-links/generate",
  ];
  for (const ep of candidates) {
    try {
      const res = await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: originalUrl, merchantUrl: originalUrl }),
      });
      if (!res.ok) continue;
      const j = await res.json();
      const short =
        j?.shortUrl || j?.url || j?.data?.shortUrl || j?.data?.url || j?.link || null;
      if (short && typeof short === "string") return short;
    } catch {
      /* next */
    }
  }
  return null;
}

export default function FinderPage() {
  const [merchant, setMerchant] = useState<"ALL" | "LAZADA_PH" | "SHOPEE_PH">("ALL");
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // tiny toast
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  function toast(msg: string) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200);
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      if (merchant !== "ALL") params.set("merchant", merchant);
      if (maxPrice) params.set("maxPrice", String(maxPrice));
      if (q.trim()) params.set("q", q.trim());

      const res = await fetch(`/api/finder/products?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ApiResp;
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load products.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // initial load
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return items
      .filter((it) => (merchant === "ALL" ? true : it.merchant === merchant))
      .filter((it) => (maxPrice ? it.price <= maxPrice : true))
      .filter((it) => (q.trim() ? it.title.toLowerCase().includes(q.toLowerCase()) : true));
  }, [items, merchant, maxPrice, q]);

  async function handleSmartlink(it: Item) {
    const short = await tryCreateSmartlink(it.url);
    const toCopy = short ?? it.url;
    const ok = await copy(toCopy);
    toast(ok ? "Link copied ✅" : "Copy failed — please try again");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* toasts */}
      <div className="fixed right-4 top-16 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className="rounded-xl border bg-white px-3 py-2 text-sm shadow">
            {t.msg}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Smart Product Finder</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Discover trending products from Shopee & Lazada. Generate a shareable smart link in one click.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col">
          <label className="text-xs text-muted-foreground">Merchant</label>
          <select
            className="mt-1 rounded-xl border px-3 py-2 text-sm"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value as any)}
          >
            <option value="ALL">All</option>
            <option value="LAZADA_PH">Lazada PH</option>
            <option value="SHOPEE_PH">Shopee PH</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-muted-foreground">Max Price (₱)</label>
          <input
            type="number"
            min={0}
            className="mt-1 rounded-xl border px-3 py-2 text-sm"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-muted-foreground">Search</label>
          <input
            type="text"
            placeholder="lamp, earbuds, phone stand…"
            className="mt-1 rounded-xl border px-3 py-2 text-sm"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") load();
            }}
          />
        </div>
      </div>

      {/* Error */}
      {err && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {err}
        </div>
      )}

      {/* Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl border bg-muted/30" />
          ))}

        {!loading &&
          filtered.map((it) => (
            <div key={it.id} className="rounded-2xl border p-3">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
                {it.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.image}
                    alt={it.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>

              <div className="mt-3 text-sm font-medium line-clamp-2">{it.title}</div>

              <div className="mt-1 flex items-center justify-between text-xs">
                <div className="text-muted-foreground">
                  ₱{Intl.NumberFormat("en-PH").format(it.price)}
                </div>
                <span
                  className={clsx(
                    "inline-flex items-center rounded-full px-2 py-0.5",
                    it.merchant === "LAZADA_PH" && "bg-blue-100 text-blue-700",
                    it.merchant === "SHOPEE_PH" && "bg-orange-100 text-orange-700"
                  )}
                >
                  {it.merchant === "LAZADA_PH"
                    ? "Lazada"
                    : it.merchant === "SHOPEE_PH"
                    ? "Shopee"
                    : it.merchant}
                </span>
              </div>

              {(it.rating || it.reviews) && (
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {it.rating ? `${it.rating.toFixed(1)}★` : ""}{" "}
                  {it.reviews ? `· ${Intl.NumberFormat().format(it.reviews)} reviews` : ""}
                </div>
              )}

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  onClick={() => handleSmartlink(it)}
                  className="rounded-xl border px-3 py-2 text-sm hover:bg-muted"
                  title="Create a Linkmint smart link and copy"
                >
                  Get Smartlink
                </button>
                <a
                  href={it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm hover:bg-muted"
                  title="Open product"
                >
                  Open product
                </a>
              </div>

              <p className="mt-2 text-[11px] text-muted-foreground">
                Tip: Share your smart link on FB, Messenger, TikTok. You may earn when friends buy.
              </p>
            </div>
          ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="mt-8 rounded-xl border p-4 text-center text-sm text-muted-foreground">
          No products match your filters. Try widening your search.
        </div>
      )}
    </div>
  );
}
