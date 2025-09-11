"use client";

import { useEffect, useState } from "react";

type MerchantItem = {
  id: string;
  name: string;
  domain: string | null;
  categories: string[];
  brands: string[];
  keywords: string[];
  notes: string | null;
};

const PRIMARY_CATEGORIES = ["apparel", "shoes", "beauty", "accessories"];

export default function MerchantSearchSection() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MerchantItem[]>([]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!query.trim() && !category) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (category) params.set("category", category);
        const res = await fetch(`/api/user/merchant-search?${params.toString()}`);
        const data = await res.json();
        setResults(data.merchants ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [query, category]);

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold mb-2">Find Merchants</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {PRIMARY_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`px-3 py-1 rounded-full text-sm border ${
              category === cat
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300"
            }`}
            onClick={() => setCategory(category === cat ? "" : cat)}
          >
            {cat[0].toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
      <input
        className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring"
        placeholder='Search items or brands… (use quotes for exact phrase)'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-gray-600">Searching…</div>
        ) : results.length === 0 ? (
          <div className="text-sm text-gray-600">No results yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {results.map((m) => (
              <div key={m.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="font-semibold">{m.name}</div>
                <div className="text-xs text-gray-500">{m.domain}</div>
                <div className="text-xs mt-1 text-gray-600">
                  {m.categories.join(", ")}
                </div>
                {m.brands.length > 0 && (
                  <div className="text-xs mt-1 text-gray-600">
                    Brands: {m.brands.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
