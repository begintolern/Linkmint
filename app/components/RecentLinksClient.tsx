// app/components/RecentLinksClient.tsx
"use client";

import { useEffect, useState } from "react";

type LocalLink = {
  id: string;
  url: string;
  shortUrl?: string;
  merchant?: string;
  createdAt: number; // epoch ms
};

// We will read from BOTH keys, then write back to the new one.
const PRIMARY_KEY = "lm_recent_links_v1";
const LEGACY_KEYS = ["lm_recent_links", "lm_recent_links_v1"];

function dedupeAndSort(items: LocalLink[]): LocalLink[] {
  const byId = new Map<string, LocalLink>();
  for (const it of items) {
    if (!it?.id) continue;
    const prev = byId.get(it.id);
    if (!prev || (it.createdAt || 0) > (prev.createdAt || 0)) {
      byId.set(it.id, it);
    }
  }
  return Array.from(byId.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function readAll(): LocalLink[] {
  const all: LocalLink[] = [];
  for (const k of LEGACY_KEYS) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const arr = JSON.parse(raw) as LocalLink[] | undefined;
      if (Array.isArray(arr)) all.push(...arr);
    } catch {
      /* ignore bad JSON */
    }
  }
  return dedupeAndSort(all);
}

function writePrimary(items: LocalLink[]) {
  localStorage.setItem(PRIMARY_KEY, JSON.stringify(items.slice(0, 50)));
}

export default function RecentLocalLinks() {
  const [items, setItems] = useState<LocalLink[]>([]);

  useEffect(() => {
    const merged = readAll();
    setItems(merged);

    // Migrate: write to PRIMARY, remove true legacy key
    writePrimary(merged);
    for (const k of LEGACY_KEYS) {
      if (k !== PRIMARY_KEY) localStorage.removeItem(k);
    }
  }, []);

  function handleOpen(u?: string) {
    if (!u) return;
    window.open(u, "_blank", "noopener,noreferrer");
  }

  function handleCopy(text?: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  function removeAt(idx: number) {
    const next = items.slice();
    next.splice(idx, 1);
    setItems(next);
    writePrimary(next);
  }

  function clearAll() {
    setItems([]);
    writePrimary([]);
  }

  if (!items.length) {
    return (
      <div className="rounded border p-4">
        <h3 className="font-semibold">Your Recent Links</h3>
        <p className="text-sm opacity-80">
          No links yet. Create one from{" "}
          <a className="underline" href="/dashboard/create-link">Create Smart Link</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Your Recent Links</h3>
        <button
          className="text-sm underline opacity-80 hover:opacity-100"
          onClick={clearAll}
        >
          Clear all
        </button>
      </div>

      <ul className="space-y-2">
        {items.map((it, idx) => (
          <li key={it.id} className="rounded border p-3">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">
                  {it.merchant || "Smart Link"} · {new Date(it.createdAt).toLocaleString()}
                </div>
                <div className="text-xs opacity-80 truncate">
                  {it.shortUrl || it.url}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className="rounded bg-blue-600 px-3 py-1 text-white text-sm"
                  onClick={() => handleOpen(it.shortUrl || it.url)}
                >
                  Open
                </button>
                <button
                  className="rounded bg-gray-200 px-3 py-1 text-sm"
                  onClick={() => handleCopy(it.shortUrl || it.url)}
                >
                  Copy
                </button>
                <button
                  className="rounded bg-red-600 px-3 py-1 text-white text-sm"
                  onClick={() => removeAt(idx)}
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
