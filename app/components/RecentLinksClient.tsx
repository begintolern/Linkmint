// app/components/RecentLinksClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type RecentLink = {
  id: string;
  shortUrl: string;
  destinationUrl: string;
  merchant?: string | null;
  createdAt: number; // ms epoch
};

type RecentClick = {
  linkId: string;
  merchant?: string | null;
  destinationUrl: string;
  shortUrl?: string | null;
  clickedAt: number; // ms epoch
};

const LINKS_KEY = "recent-links";
const CLICKS_KEY = "recent-clicks";
const MAX_ITEMS = 20;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors for now
  }
}

export default function RecentLinksClient() {
  const [links, setLinks] = useState<RecentLink[]>([]);
  const [clicks, setClicks] = useState<RecentClick[]>([]);

  // Load once on mount
  useEffect(() => {
    const stored = readJson<RecentLink[]>(LINKS_KEY, []);
    setLinks(stored.slice(0, MAX_ITEMS));

    const storedClicks = readJson<RecentClick[]>(CLICKS_KEY, []);
    setClicks(storedClicks.slice(0, MAX_ITEMS));
  }, []);

  const hasLinks = links.length > 0;
  const hasClicks = clicks.length > 0;

  function handleRemove(id: string) {
    const next = links.filter((l) => l.id !== id);
    setLinks(next);
    writeJson(LINKS_KEY, next);
  }

  function handleEdit(id: string) {
    const item = links.find((l) => l.id === id);
    if (!item) return;
    const nextUrl = prompt("Update destination URL:", item.destinationUrl);
    if (!nextUrl) return;
    const next = links.map((l) =>
      l.id === id ? { ...l, destinationUrl: nextUrl } : l
    );
    setLinks(next);
    writeJson(LINKS_KEY, next);
  }

  // NEW: track click to localStorage, then navigate
  function handleOpen(item: RecentLink) {
    try {
      const entry: RecentClick = {
        linkId: item.id,
        merchant: item.merchant ?? null,
        destinationUrl: item.destinationUrl,
        shortUrl: item.shortUrl,
        clickedAt: Date.now(),
      };
      const current = readJson<RecentClick[]>(CLICKS_KEY, []);
      const next = [entry, ...current].slice(0, MAX_ITEMS);
      writeJson(CLICKS_KEY, next);
      setClicks(next);
    } catch {
      // best-effort
    }
    // Navigate to product
    window.open(item.destinationUrl, "_blank", "noopener,noreferrer");
  }

  const sortedLinks = useMemo(
    () => [...links].sort((a, b) => b.createdAt - a.createdAt),
    [links]
  );

  const sortedClicks = useMemo(
    () => [...clicks].sort((a, b) => b.clickedAt - a.clickedAt),
    [clicks]
  );

  return (
    <div className="grid gap-8">
      {/* Recent Links */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Your Recent Links</h2>
        {!hasLinks ? (
          <div className="text-sm opacity-70">
            No links yet. Create one from{" "}
            <Link href="/dashboard/create-link" className="underline">
              Create Smart Link
            </Link>
            .
          </div>
        ) : (
          <div className="space-y-3">
            {sortedLinks.map((l) => (
              <div
                key={l.id}
                className="rounded border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {l.merchant || "Link"}
                  </div>
                  <div className="text-xs opacity-70 break-all">
                    {l.destinationUrl}
                  </div>
                  <div className="text-[11px] opacity-60 mt-1">
                    Created {new Date(l.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpen(l)}
                    className="rounded bg-blue-600 px-3 py-1.5 text-white text-sm hover:bg-blue-700"
                  >
                    Open Product
                  </button>
                  <button
                    onClick={() => handleEdit(l.id)}
                    className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRemove(l.id)}
                    className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Clicks */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Recent Clicks</h2>
        {!hasClicks ? (
          <div className="text-sm opacity-70">
            No clicks yet. Use <b>Open Product</b> on a link to log a click.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedClicks.map((c, idx) => (
              <div
                key={idx}
                className="rounded border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {c.merchant || "Click"}
                  </div>
                  <div className="text-xs opacity-70 break-all">
                    {c.destinationUrl}
                  </div>
                  <div className="text-[11px] opacity-60 mt-1">
                    Clicked {new Date(c.clickedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={c.destinationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-blue-600 px-3 py-1.5 text-white text-sm hover:bg-blue-700"
                  >
                    Open Again
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
