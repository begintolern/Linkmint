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

/** Load recent links from either key, prefer v2 if present. */
function loadRecent(): RecentLink[] {
  const rawV2 = typeof window !== "undefined" ? localStorage.getItem(KEY_V2) : null;
  const rawV1 = typeof window !== "undefined" ? localStorage.getItem(KEY_V1) : null;

  const tryParse = (raw: string | null) => {
    if (!raw) return null;
    try {
      const arr = JSON.parse(raw) as any[];
      if (Array.isArray(arr)) return arr as RecentLink[];
      return null;
    } catch {
      return null;
    }
  };

  return tryParse(rawV2) ?? tryParse(rawV1) ?? [];
}

function saveRecent(items: RecentLink[]) {
  try {
    localStorage.setItem(KEY_V2, JSON.stringify(items));
  } catch (e) {
    console.warn("recent-links save failed:", e);
  }
}

export default function RecentLinksClient() {
  const [items, setItems] = useState<RecentLink[]>([]);
  const [debugMsg, setDebugMsg] = useState<string>("");

  const refresh = useCallback(() => {
    const data = loadRecent();
    setItems(data);
    setDebugMsg(`Loaded ${data.length} from localStorage`);
    // Mirror into v2 so we standardize storage going forward
    saveRecent(data);
  }, []);

  useEffect(() => {
    refresh();

    // Also refresh when the tab becomes visible again
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);

    // Manual cross-tab sync (storage events don’t fire in same tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY_V1 || e.key === KEY_V2) refresh();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const removeOne = (id: string) => {
    const next = items.filter((x) => x.id !== id);
    setItems(next);
    saveRecent(next);
  };

  const copyShort = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert("Short link copied!");
    } catch {
      prompt("Copy this link:", url);
    }
  };

  const openShort = (url: string) => {
    // Ensure absolute URL opens correctly (no client-side router involvement)
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openProduct = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section data-testid="recent-links-root" className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Your Recent Links</h2>
        <button
          type="button"
          onClick={refresh}
          className="rounded bg-gray-200 px-2 py-1 text-sm hover:bg-gray-300"
          title="Reload from localStorage"
        >
          Refresh
        </button>
        <span className="text-xs opacity-60">{debugMsg}</span>
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
                <div className="truncate text-xs opacity-60">
                  Dest: {l.destinationUrl}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openShort(l.shortUrl)}
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
                  onClick={() => openProduct(l.destinationUrl)}
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
