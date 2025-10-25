// app/components/RecentLinksClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type DemoLink = {
  id: string;
  createdAt: number;      // epoch ms
  sourceUrl: string;      // original product url
  smartUrl: string;       // fake short link
  note?: string;
};

const LS_KEY = "lm_recent_links_v1";
const MAX_ITEMS = 20;

function loadRecent(): DemoLink[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as DemoLink[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveRecent(items: DemoLink[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {}
}

export function addRecentLink(item: DemoLink) {
  try {
    const items = loadRecent();
    const next = [item, ...items].slice(0, MAX_ITEMS);
    saveRecent(next);
  } catch {}
}

export default function RecentLinksClient() {
  const [items, setItems] = useState<DemoLink[]>([]);

  useEffect(() => {
    setItems(loadRecent());
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY) setItems(loadRecent());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const empty = useMemo(() => items.length === 0, [items]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied!");
    } catch {}
  };

  return (
    <div className="rounded-2xl border bg-white p-4 sm:p-5">
      <h2 className="text-base font-medium sm:text-lg">Your recent links</h2>

      {empty ? (
        <p className="mt-2 text-sm text-gray-600">
          Your last created links will appear here. Create one to get started.
        </p>
      ) : (
        <div className="mt-3 divide-y">
          {items.map((it) => (
            <div key={it.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{it.smartUrl}</p>
                <p className="text-xs text-gray-500 truncate">from {it.sourceUrl}</p>
                <p className="text-[11px] text-gray-400">
                  {new Date(it.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={it.smartUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                >
                  Open
                </a>
                <button
                  onClick={() => copy(it.smartUrl)}
                  className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                >
                  Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
