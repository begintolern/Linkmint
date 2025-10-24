"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

type Item = {
  id: string;
  title?: string;
  name?: string;
  price?: number | string;
  merchant?: string;
  url?: string;
  image?: string;
};

export default function AISuggestionsClient() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Resolve origin safely on client
  const origin = useMemo(() => {
    if (typeof window === "undefined") return "https://linkmint.co";
    return window.location.origin || "https://linkmint.co";
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/finder/products?limit=6", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) {
          setItems(Array.isArray(json.items) ? json.items.slice(0, 6) : []);
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-medium sm:text-lg">✨ AI Suggestions (beta)</h2>
        <span className="rounded-full border px-2 py-0.5 text-[11px] text-gray-700">Preview</span>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Analyzing current offers…</p>
      ) : !items?.length ? (
        <p className="text-sm text-gray-500">No suggestions available right now.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const title = it.title || it.name || "Suggested product";
            const targetUrl = it.url || "";
            const createLinkHref = `/dashboard/create-link${
              targetUrl ? `?url=${encodeURIComponent(targetUrl)}` : ""
            }`;

            return (
              <div key={it.id} className="group rounded-xl border p-3 hover:shadow-sm transition">
                <a
                  href={targetUrl || "#"}
                  className="block"
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-50 mb-3">
                    {it.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.image}
                        alt={title}
                        className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform"
                      />
                    ) : null}
                  </div>
                  <div className="text-sm font-medium line-clamp-2">{title}</div>
                  <div className="mt-1 text-xs text-gray-600">
                    {it.merchant ? it.merchant : "Suggested"}
                    {it.price ? ` · ${it.price}` : ""}
                  </div>
                </a>

                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={targetUrl || "#"}
                    className="text-xs text-blue-600 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open offer →
                  </a>
                  <span className="text-gray-300">·</span>
                  <Link
                    href={createLinkHref}
                    className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
                  >
                    Create Smart Link
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-3 text-[11px] text-gray-500">
        This beta uses heuristic signals for now; we’ll swap in the full AI engine later.
      </p>
    </section>
  );
}
