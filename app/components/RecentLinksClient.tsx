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

function parseList(raw: string | null): RecentLink[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw ?? "[]");
    return Array.isArray(arr) ? (arr as RecentLink[]) : [];
  } catch {
    return [];
  }
}

/** Load from v2 (preferred) and v1, dedupe by id, newest first. */
function loadRecent(): RecentLink[] {
  const v2 = parseList(typeof window !== "undefined" ? localStorage.getItem(KEY_V2) : null);
  const v1 = parseList(typeof window !== "undefined" ? localStorage.getItem(KEY_V1) : null);
  const map = new Map<string, RecentLink>();
  [...v2, ...v1].forEach((x) => map.set(x.id, x));
  return Array.from(map.values()).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

function saveV2(items: RecentLink[]) {
  try {
    localStorage.setItem(KEY_V2, JSON.stringify(items));
  } catch (e) {
    console.warn("recent-links save failed:", e);
  }
}

type Props = {
  /** Keep false so we don’t duplicate controls with the page toolbar. */
  showToolbar?: boolean;
};

export default function RecentLinksClient({ showToolbar = false }: Props) {
  const [items, setItems] = useState<RecentLink[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string>("");

  const announce = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 1800);
  };

  const refresh = useCallback(() => {
    setBusy(true);
    const data = loadRecent();
    setItems(data);
    saveV2(data);
    const ts = Date.now();
    setLastRefreshed(ts);
    announce(`Refreshed ${new Date(ts).toLocaleTimeString()}`);
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
      announce("Cleared");
      setBusy(false);
    }
  };

  useEffect(() => {
    refresh();

    // Refresh when tab becomes visible
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);

    // Sync when localStorage changes (other tabs/windows)
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY_V1 || e.key === KEY_V2) refresh();
    };
    window.addEventListener("storage", onStorage);

    // Page-level toolbar events
    const onExternalRefresh = () => refresh();
    const onExternalClear = () => clearAll();
    window.addEventListener("recent-links:refresh", onExternalRefresh as EventListener);
    window.addEventListener("recent-links:clear", onExternalClear as EventListener);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("recent-links:refresh", onExternalRefresh as EventListener);
      window.removeEventListener("recent-links:clear", onExternalClear as EventListener);
    };
  }, [refresh]);

  const removeOne = (id: string) => {
    const next = items.filter((x) => x.id !== id);
    setItems(next);
    saveV2(next);
    announce("Removed");
  };

  const copyShort = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      announce("Copied!");
    } catch {
      prompt("Copy this link:", url);
    }
  };

  const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  return (
    <section data-testid="recent-links-root" className="space-y-3">
      {/* No internal header/toolbar to avoid duplication with the page */}

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

      {/* Status line (kept, compact) */}
      <div className="text-xs opacity-60" aria-live="polite">
        {notice
          ? notice
          : lastRefreshed
          ? `Last refreshed ${new Date(lastRefreshed).toLocaleTimeString()}`
          : " "}
      </div>
    </section>
  );
}
