"use client";

import { useEffect, useState } from "react";

type RecentItem = {
  id: string;
  shortUrl?: string;
  merchant?: string;
  createdAt?: string; // ISO string
};

function loadRecent(): RecentItem[] {
  try {
    const raw = localStorage.getItem("recentLinks");
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    // newest first
    return [...arr].sort((a: RecentItem, b: RecentItem) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return tb - ta;
    });
  } catch {
    return [];
  }
}

export default function RecentLocalLinks() {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    setItems(loadRecent());

    // listen for other tabs/pages adding links
    function onStorage(e: StorageEvent) {
      if (e.key === "recentLinks") {
        setItems(loadRecent());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!items.length) {
    return (
      <div className="rounded-lg border p-4">
        <div className="text-sm font-semibold mb-1">Your Recent Links</div>
        <div className="text-sm opacity-70">No links yet. Create one to see it here.</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm font-semibold mb-3">Your Recent Links</div>
      <ul className="space-y-2">
        {items.map((it, idx) => {
          const when = it.createdAt
            ? new Date(it.createdAt).toLocaleString()
            : "—";
          return (
            <li
              key={`${it.id}-${idx}`}
              className="flex items-center justify-between rounded border px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm">
                  {it.shortUrl ? (
                    <a
                      href={it.shortUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:no-underline"
                    >
                      {it.shortUrl}
                    </a>
                  ) : (
                    <span className="opacity-70">ID: {it.id}</span>
                  )}
                </div>
                <div className="text-xs opacity-70 truncate">
                  {it.merchant ?? "Unknown"} · {when}
                </div>
              </div>
              {it.shortUrl && (
                <a
                  href={it.shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-3 rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                >
                  Open
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
