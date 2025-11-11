"use client";

import { useEffect, useState, useCallback } from "react";
import {
  loadRecentLinks,
  clearRecentLinks,
  RecentLink,
} from "@/components/recentLinks";

export default function CompactRecent() {
  const [items, setItems] = useState<RecentLink[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string>("");

  const refresh = useCallback(() => {
    setBusy(true);
    const data = loadRecentLinks();
    setItems(data);
    setBusy(false);
    const ts = Date.now();
    setNotice(`Refreshed ${new Date(ts).toLocaleTimeString()}`);
    setTimeout(() => setNotice(""), 1200);
  }, []);

  const clearAll = useCallback(() => {
    setBusy(true);
    clearRecentLinks();
    setItems([]);
    setBusy(false);
    setNotice("Cleared");
    setTimeout(() => setNotice(""), 900);
  }, []);

  useEffect(() => {
    refresh();

    const onCustom = () => refresh();
    window.addEventListener("lm-recent-links-changed", onCustom as EventListener);

    return () => {
      window.removeEventListener("lm-recent-links-changed", onCustom as EventListener);
    };
  }, [refresh]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">Recent Links (this device)</h2>
        <button
          type="button"
          onClick={refresh}
          disabled={busy}
          className="rounded bg-gray-200 px-2 py-1 text-xs hover:bg-gray-300 disabled:opacity-50"
        >
          {busy ? "Refreshing…" : "Refresh"}
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={busy}
          className="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200 disabled:opacity-50"
        >
          Clear
        </button>
        <span className="text-[11px] opacity-60">{notice || " "}</span>
      </div>

      {items.length === 0 ? (
        <div className="rounded border p-3 text-xs opacity-70">
          No recent links yet — create one above.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 5).map((l) => (
            <li key={l.id} className="rounded border p-3">
              <div className="text-sm font-medium truncate">
                {l.merchant ? `${l.merchant} · ` : ""}ID: {l.id}
              </div>
              <div className="truncate text-xs">
                <span className="opacity-60">Short: </span>
                <a
                  href={l.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {l.shortUrl}
                </a>
              </div>
              <div className="truncate text-xs opacity-80">
                Dest: {l.destinationUrl}
              </div>
              <div className="mt-1 text-[11px] opacity-70">
                Created: {new Date(l.createdAt ?? Date.now()).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
