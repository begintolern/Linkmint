// components/search/MerchantSearchSection.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type MerchantItem = {
  id: string;
  name: string;
  domain: string | null;
  categories: string[];
  brands: string[];
  keywords: string[];
  apply?: string | null; // present in API but unused here
};

// Provisioned primary + near-future categories
const PRIMARY = [
  "apparel",
  "shoes",
  "beauty",
  "accessories",
  "travel",
  "pets",
  "electronics",
  "software",
];

function buildMerchantUrl(name: string, domain?: string | null) {
  if (domain && domain.trim()) {
    const d = domain.trim();
    if (d.startsWith("http://") || d.startsWith("https://")) return d;
    return `https://${d}`;
  }
  const q = encodeURIComponent(name);
  return `https://www.google.com/search?q=${q}`;
}

export default function MerchantSearchSection() {
  const [category, setCategory] = useState<string>("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MerchantItem[]>([]);
  const debounce = useRef<any>(null);

  // Drawer state (UI shell only)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<MerchantItem | null>(null);
  const [productUrl, setProductUrl] = useState("");

  async function runSearch(params: { category?: string; q?: string }) {
    const sp = new URLSearchParams();
    if (params.category) sp.set("category", params.category);
    if (params.q && params.q.trim()) sp.set("q", params.q.trim());
    setLoading(true);
    try {
      const res = await fetch(`/api/user/merchant-search?${sp.toString()}`, { cache: "no-store" });
      const data = await res.json();
      setResults(data.merchants ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleCategory(cat: string) {
    const next = category === cat ? "" : cat;
    setCategory(next);
    runSearch({ category: next, q });
  }

  useEffect(() => {
    // default-empty: no chip & no query → do not fetch
    if (!category && !q.trim()) {
      setResults([]);
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runSearch({ category, q }), 300);
    return () => clearTimeout(debounce.current);
  }, [q, category]);

  function openDrawer(m: MerchantItem) {
    setSelected(m);
    setProductUrl("");
    setDrawerOpen(true);
  }
  function closeDrawer() {
    setDrawerOpen(false);
    setSelected(null);
    setProductUrl("");
  }

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold mb-3">Find Merchants</h2>

      <div className="flex flex-wrap gap-2 mb-3">
        {PRIMARY.map((cat) => {
          const active = category === cat;
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-3 py-1 rounded-full text-sm border transition ${
                active
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              {cat[0].toUpperCase() + cat.slice(1)}
            </button>
          );
        })}
      </div>

      <input
        className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring"
        placeholder='Search items or brands… (use quotes for exact phrase)'
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="mt-4">
        {loading ? (
          <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">Loading…</div>
        ) : results.length === 0 ? (
          <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">
            {category
              ? `No merchants tagged for ${category}.`
              : q.trim()
              ? "No matching merchants."
              : "Pick a category or type a brand/item."}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {results.map((m) => {
              const href = buildMerchantUrl(m.name, m.domain ?? undefined);
              return (
                <div key={m.id} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="font-semibold">{m.name}</div>
                  <div className="text-xs text-gray-500">{m.domain ?? "—"}</div>

                  <div className="mt-2 text-xs text-gray-600">
                    {m.categories.length ? `Categories: ${m.categories.join(", ")}` : null}
                  </div>
                  {m.brands.length ? (
                    <div className="mt-1 text-xs text-gray-600">Brands: {m.brands.join(", ")}</div>
                  ) : null}
                  {m.keywords.length ? (
                    <div className="mt-1 text-xs text-gray-600">Keywords: {m.keywords.join(", ")}</div>
                  ) : null}

                  <div className="mt-3 flex gap-2">
                    {/* Visit Merchant */}
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-lg bg-gray-900 px-3 py-1.5 text-white text-sm hover:bg-black"
                      aria-label={`Visit ${m.name}`}
                    >
                      Visit Merchant
                    </a>

                    {/* Generate Smart Link (UI shell only) */}
                    <button
                      onClick={() => openDrawer(m)}
                      className="inline-block rounded-lg bg-blue-600 px-3 py-1.5 text-white text-sm hover:bg-blue-700"
                      aria-label={`Generate Smart Link for ${m.name}`}
                    >
                      Generate Smart Link
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right-side Drawer (UI shell only) */}
      {drawerOpen ? (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            aria-hidden="true"
            onClick={closeDrawer}
          />
          {/* Panel */}
          <aside
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-white shadow-xl border-l"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <div className="text-sm text-gray-500">Smart Link Generator</div>
                <div className="text-lg font-semibold">{selected?.name ?? "Merchant"}</div>
                {selected?.domain ? (
                  <div className="text-xs text-gray-500">{selected.domain}</div>
                ) : null}
              </div>
              <button
                onClick={closeDrawer}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="text-sm text-gray-600">
                Paste a product page URL from the merchant’s site. On the next step we’ll convert it
                into a trackable Smart Link you can share.
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Product URL</label>
                <input
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder={`e.g. ${selected?.domain ?? "https://example.com/product/123"}`}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring"
                />
              </div>

              {/* Placeholder action: disabled until backend is wired */}
              <button
                disabled
                className="w-full rounded-lg bg-blue-600 px-3 py-2 text-white text-sm opacity-60 cursor-not-allowed"
                title="Coming soon"
              >
                Create Smart Link (coming soon)
              </button>

              <div className="text-xs text-gray-500">
                Tip: Navigate to a product on the merchant’s site, copy the URL from your browser,
                then paste it here.
              </div>
            </div>
          </aside>
        </>
      ) : null}
    </section>
  );
}
