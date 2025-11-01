"use client";

import { useEffect, useMemo, useState } from "react";

type RecentLink = {
  id: string;
  shortUrl: string;        // e.g., https://lm.to/abc123?t=...&m=...
  merchant: string;        // e.g., "Lazada PH"
  destinationUrl: string;  // original product URL
  createdAt: number;       // epoch ms
};

const LS_KEY = "recent-smartlinks";

function loadFromLS(): RecentLink[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(Boolean);
  } catch {
    return [];
  }
}

function saveToLS(next: RecentLink[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function isValidHttpUrl(u?: string | null) {
  if (!u) return false;
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function RecentLinksClient() {
  const [items, setItems] = useState<RecentLink[]>([]);

  // initial load
  useEffect(() => {
    setItems(loadFromLS());
  }, []);

  const hasItems = items.length > 0;

  function removeOne(id: string) {
    const next = items.filter((it) => it.id !== id);
    setItems(next);
    saveToLS(next);
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  const sorted = useMemo(
    () => [...items].sort((a, b) => b.createdAt - a.createdAt),
    [items]
  );

  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold mb-3">Your Recent Links</h2>

      {!hasItems && (
        <div className="rounded border p-4 text-sm opacity-80">
          No links yet. Create your first smart link to see it here.
        </div>
      )}

      {hasItems && (
        <div className="space-y-3">
          {sorted.map((it) => {
            const created = new Date(it.createdAt).toLocaleString();
            const canOpenShort = isValidHttpUrl(it.shortUrl);
            const canOpenProduct = isValidHttpUrl(it.destinationUrl);

            return (
              <div
                key={`${it.id}-${it.createdAt}`}
                className="rounded-lg border p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {it.merchant} • <span className="opacity-80">{it.id}</span>
                  </div>
                  <div className="text-xs opacity-70">
                    Created {created}
                  </div>
                  <div className="text-xs mt-1 break-all opacity-80">
                    {it.shortUrl}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Open Short as a REAL <a>, never a button */}
                  {canOpenShort ? (
                    <a
                      href={it.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
                      title="Open the short link in a new tab"
                    >
                      Open Short
                    </a>
                  ) : (
                    <button
                      className="rounded bg-gray-400 px-3 py-1.5 text-white"
                      title="Short URL is invalid"
                      disabled
                    >
                      Open Short
                    </button>
                  )}

                  {/* Open product */}
                  {canOpenProduct ? (
                    <a
                      href={it.destinationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700"
                      title="Open the original product in a new tab"
                    >
                      Open Product
                    </a>
                  ) : (
                    <button
                      className="rounded bg-gray-400 px-3 py-1.5 text-white"
                      title="Product URL is invalid"
                      disabled
                    >
                      Open Product
                    </button>
                  )}

                  {/* Copy short link */}
                  <button
                    className="rounded bg-neutral-700 px-3 py-1.5 text-white hover:bg-neutral-800"
                    onClick={() => copy(it.shortUrl)}
                    title="Copy the short link to clipboard"
                  >
                    Copy Short
                  </button>

                  {/* Edit (placeholder) */}
                  <button
                    className="rounded bg-purple-600 px-3 py-1.5 text-white hover:bg-purple-700"
                    onClick={() => alert("Edit coming soon")}
                    title="Edit link (coming soon)"
                  >
                    Edit
                  </button>

                  {/* Remove (local only) */}
                  <button
                    className="rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
                    onClick={() => removeOne(it.id)}
                    title="Remove from your recent list"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
