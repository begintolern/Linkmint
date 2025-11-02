"use client";

import { useEffect, useState, useCallback } from "react";

type RecentLink = {
  id: string;
  shortUrl: string;
  merchant?: string;
  destinationUrl: string;
  createdAt?: number;
  pinned?: boolean;
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
  return items.map((x) => ({
    ...x,
    createdAt: typeof x.createdAt === "number" ? x.createdAt : Date.now(),
    pinned: typeof x.pinned === "boolean" ? x.pinned : false,
  }));
}

/** Merge with **v2 preferred** so pin state persists. */
function mergePreferV2(v1: RecentLink[], v2: RecentLink[]): RecentLink[] {
  const map = new Map<string, RecentLink>();
  // write older (v1) first…
  for (const it of v1) map.set(it.id, it);
  // …then overwrite with v2 (preferred)
  for (const it of v2) map.set(it.id, it);
  return Array.from(map.values());
}

/** Load: v2 preferred, dedupe, normalize, sort (pinned first, then newest) */
function loadRecent(): RecentLink[] {
  const v2 = parseList(typeof window !== "undefined" ? localStorage.getItem(KEY_V2) : null);
  const v1 = parseList(typeof window !== "undefined" ? localStorage.getItem(KEY_V1) : null);
  const merged = mergePreferV2(v1, v2);
  const arr = normalize(merged);
  return arr.sort((a, b) => {
    const pinDelta = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
    if (pinDelta !== 0) return pinDelta;
    return (b.createdAt! - a.createdAt!);
  });
}

function saveV2(items: RecentLink[]) {
  try {
    localStorage.setItem(KEY_V2, JSON.stringify(items));
  } catch (e) {
    console.warn("recent-links save failed:", e);
  }
}

function broadcastChange() {
  window.dispatchEvent(new Event("lm-recent-links-changed"));
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
    saveV2(data); // always normalize into v2
    const ts = Date.now();
    setLastRefreshed(ts);
    setNotice(`Refreshed ${new Date(ts).toLocaleTimeString()}`);
    setTimeout(() => setNotice(""), 1500);
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
      setTimeout(() => setNotice(""), 1500);
      setBusy(false);
      broadcastChange();
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

  const commit = (next: RecentLink[], toast: string) => {
    const normalized = normalize(next).sort((a, b) => {
      const pinDelta = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      if (pinDelta !== 0) return pinDelta;
      return (b.createdAt! - a.createdAt!);
    });
    setItems(normalized);
    saveV2(normalized);
    setNotice(toast);
    setTimeout(() => setNotice(""), 1200);
    broadcastChange();
  };

  const togglePin = (id: string) => {
    const next = items.map((x) => (x.id === id ? { ...x, pinned: !x.pinned } : x));
    const nowPinned = next.find((x) => x.id === id)?.pinned;
    commit(next, nowPinned ? "Pinned" : "Unpinned");
  };

  const removeOne = (id: string) => {
    const next = items.filter((x) => x.id !== id);
    commit(next, "Removed");
  };

  const copyShort = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Copied!");
      setTimeout(() => setNotice(""), 900);
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
                <div className="truncate font-medium flex items-center gap-2">
                  {l.pinned && (
                    <span
                      className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800"
                      title="Pinned"
                    >
                      ★ Pinned
                    </span>
                  )}
                  <span className="truncate">
                    {l.merchant ? `${l.merchant} · ` : ""}
                    <span className="opacity-70">ID:</span> {l.id}
                  </span>
                </div>
                <div className="truncate text-sm">
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
                <div className="truncate text-xs opacity-80">Dest: {l.destinationUrl}</div>
                <div className="mt-1 text-sm">
                  <span className="opacity-60">Created:</span>{" "}
                  <span className="font-medium">
                    {new Date(l.createdAt ?? Date.now()).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => togglePin(l.id)}
                  className="rounded border px-3 py-1.5 text-sm hover:bg-yellow-50"
                  title={l.pinned ? "Unpin" : "Pin"}
                >
                  {l.pinned ? "Unpin" : "Pin"}
                </button>

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
