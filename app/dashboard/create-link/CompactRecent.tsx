// app/dashboard/create-link/CompactRecent.tsx
"use client";

import { useEffect, useState, useCallback } from "react";

type RecentLink = {
  id: string;
  shortUrl: string;
  merchant?: string;
  destinationUrl: string;
  createdAt: number;
};

const KEY_V1 = "recent-links";
const KEY_V2 = "recent-links:v2";

function parse(raw: string | null): RecentLink[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as RecentLink[]) : [];
  } catch { return []; }
}

function loadTop3(): RecentLink[] {
  const v2 = parse(typeof window !== "undefined" ? localStorage.getItem(KEY_V2) : null);
  const v1 = parse(typeof window !== "undefined" ? localStorage.getItem(KEY_V1) : null);
  const map = new Map<string, RecentLink>();
  [...v2, ...v1].forEach(x => map.set(x.id, x));
  return Array.from(map.values())
    .sort((a,b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    .slice(0, 3);
}

export default function CompactRecent() {
  const [items, setItems] = useState<RecentLink[]>([]);

  const refresh = useCallback(() => setItems(loadTop3()), []);

  useEffect(() => {
    refresh();
    const onVis = () => { if (document.visibilityState === "visible") refresh(); };
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY_V1 || e.key === KEY_V2) refresh();
    };
    const onCustom = () => refresh();

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("storage", onStorage);
    window.addEventListener("lm-recent-links-changed", onCustom as EventListener);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("lm-recent-links-changed", onCustom as EventListener);
    };
  }, [refresh]);

  const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const copy = async (url: string) => {
    try { await navigator.clipboard.writeText(url); } catch { prompt("Copy:", url); }
  };

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">Recent Links</h2>

      {items.length === 0 ? (
        <div className="rounded border p-3 text-sm opacity-70">
          Your new links will appear here right after you create them.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 rounded border p-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {l.merchant ? `${l.merchant} · ` : ""}{new URL(l.destinationUrl).hostname}
                </div>
                <div className="truncate text-xs opacity-70">{l.shortUrl}</div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => copy(l.shortUrl)}
                  className="rounded bg-gray-800 px-3 py-1.5 text-xs text-white hover:bg-black"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => open(l.shortUrl)}
                  className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700"
                >
                  Open Short
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
