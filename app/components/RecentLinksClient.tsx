"use client";

import { useEffect, useState, useCallback } from "react";

type RecentLink = {
  id: string;
  shortUrl: string;
  merchant?: string;
  destinationUrl: string;
  createdAt?: number; // older entries may lack this
};

const KEY_V1 = "recent-links";
const KEY_V2 = "recent-links:v2";

function parseList(raw: string | null): RecentLink[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as RecentLink[]) : [];
  } catch {
    return [];
  }
}

function normalize(items: RecentLink[]): RecentLink[] {
  // Ensure createdAt exists; if missing, use "now" so it still sorts and displays.
  return items.map((x) => ({
    ...x,
    createdAt: typeof x.createdAt === "number" ? x.createdAt : Date.now(),
  }));
}

/** Load recent links from either key, prefer v2, dedupe, normalize, sort newest-first. */
function loadRecent(): RecentLink[] {
  const v2 = parseList(typeof window !== "undefined" ? localStorage.getItem(KEY_V2) : null);
  const v1 = parseList(typeof window !== "undefined" ? localStorage.getItem(KEY_V1) : null);
  const map = new Map<string, RecentLink>();
  [...v2, ...v1].forEach((x) => map.set(x.id, x));
  const arr = normalize(Array.from(map.values()));
  return arr.sort((a, b) => (b.createdAt! - a.createdAt!));
}

function saveV2(items: RecentLink[]) {
  try {
    localStorage.setItem(KEY_V2, JSON.stringify(items));
  } catch (e) {
    console.warn("recent-links save failed:", e);
  }
}

export default function RecentLinksClient() {
  const [items, setItems] = useState<RecentLink[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string>("");

  const refresh = useCallback(() => {
    setBusy(true);
    const data = loadRecent();
    setItems(data);
    saveV2(data); // normalize to v2
    const ts = Date.now();
    setLastRefreshed(ts);
    setNotice(`Refreshed ${new Date(ts).toLocaleTimeString()}`);
    setTimeout(() => setNotice(""), 2000);
    setBusy(false);
  }, []);

  const clearAll = () => {
    setBusy(true);
    try {
      localStorage.removeItem(KEY_V1);
      localStorage.removeItem(KEY_V2);
    } finally {
      setItems([]);
      const ts = Date.now();
      setLastRefreshed(ts);
      setNotice("Cleared");
      setTimeout(() => setNotice(""), 2000);
      setBusy(false);
    }
  };

  useEffect(() => {
    refresh();

    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);

    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY_V1 || e.key === KEY_V2) refresh();
    };
    window.addEventListener("storage", onStorage);

    const onCustom = () => refresh();
    window.addEventListener("lm-recent-links-changed", onCustom as EventListener);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("lm-recent-links-changed", onCustom as EventListener);
    };
  }, [refresh]);

  const removeOne = (id: string) => {
    const next = items.filter((x) => x.id !== id);
    setItems(next);
    saveV2(next);
    setNotice("Removed");
    setTimeout(() => setNotice(""), 1500);
  };

  const copyShort = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Copied!");
      setTimeout(() => setNotice(""), 1200);
    } catch {
      prompt("Copy this link:", url);
    }
  };

  const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  return (
    <section data-testid="recent-links-root" className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">Your Recent Links</h2>

        <button
          type="button"
          onClick={refresh}
          disabled={busy}
          className="rounded bg-gray-200 px-2 py-1 text-sm hover:bg-gray-300 disabled:opacity-50"
          title="Reload from localStorage"
        >
          {busy ? "Refreshing…" : "Refresh"}
        </button>

        <button
          type="button"
          onClick={clearAll}
          disabled={busy}
          className="rounded bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200 disabled:opacity-50"
          title="Clear recent links on this device"
        >
          Clear
        </button>

        <span className="text-xs opacity-60">
          {notice
            ? notice
            : lastRefreshed
            ? `Last refreshed ${new Date(lastRefreshed).toLocaleTimeString()}`
            : "—"}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded border p-4 text-sm opacity-70">
          No recent links yet. Create one from <b>Create Smart Link</b> and it will appear here.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((l) => (
            <li
              key={l.id}
              className="flex flex-col gap-2 rounded border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {l.merchant ? `${l.merchant} · ` : ""}
                  <span className="opacity-70">ID:</span> {l.id}
                </div>
                <div className="truncate text-sm opacity-80">
                  <span className="opacity-60">Short: </span>
                  <a
                    href={l.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    data-testid="recent-short-anchor"
                  >
                    {l.shortUrl}
                  </a>
                </div>
                <div className="truncate text-xs opacity-60">Dest: {l.destinationUrl}</div>
                <div className="truncate text-xs opacity-60">
                  Created: {new Date(l.createdAt ?? Date.now()).toLocaleString()}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => open(l.shortUrl)}
                  className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
                  title="Open the short link"
                >
                  Open Short
                </button>
                <button
                  type="button"
                  onClick={() => copyShort(l.shortUrl)}
                  className="rounded bg-gray-800 px-3 py-1.5 text-white hover:bg-black"
                  title="Copy short URL"
                >
                  Copy Short
                </button>
                <button
                  type="button"
                  onClick={() => open(l.destinationUrl)}
                  className="rounded bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700"
                  title="Open product page"
                >
                  Open Product
                </button>
                <button
                  type="button"
                  onClick={() => removeOne(l.id)}
                  className="rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
                  title="Remove from recent"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
