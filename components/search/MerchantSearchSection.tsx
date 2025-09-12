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
  apply?: string | null;
};

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
    if (!category && !q.trim()) {
      setResults([]);
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runSearch({ category, q }), 300);
    return () => clearTimeout(debounce.current);
  }, [q, category]);

  // --- tiny analytics (non-blocking, survives navigation) ---
  function logMerchantVisit(m: MerchantItem) {
    try {
      const body = JSON.stringify({
        type: "merchant_visit",
        merchantId: m.id,
        merchantName: m.name,
        merchantDomain: m.domain,
        ts: Date.now(),
      });
      // Use keepalive so the request isn't dropped on navigation
      fetch("/api/event-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* no-op */
    }
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
              ? `No merchants tagged for ${category} yet. We’re adding more soon.`
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

                  <div className="mt-3">
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logMerchantVisit(m)}
                      className="inline-block rounded-lg bg-gray-900 px-3 py-1.5 text-white text-sm hover:bg-black"
                      aria-label={`Visit ${m.name}`}
                    >
                      Visit Merchant
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
