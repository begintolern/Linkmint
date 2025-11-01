// app/dashboard/links/RecentLocalLinks.tsx
"use client";

import { useEffect, useState, useCallback } from "react";

type RecentLink = {
  id: string;
  shortUrl: string;
  merchant?: string;
  destinationUrl: string;
  createdAt: number;
};

const LOCAL_KEY = "recent-links:v2";

/** Load locally cached links */
function loadLocal(): RecentLink[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as RecentLink[]) : [];
  } catch {
    return [];
  }
}

export default function RecentLocalLinks() {
  const [links, setLinks] = useState<RecentLink[]>([]);

  const refresh = useCallback(() => {
    setLinks(loadLocal());
  }, []);

  useEffect(() => {
    refresh();

    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const openShort = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const copyShort = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert("Copied!");
    } catch {
      prompt("Copy this link:", url);
    }
  };

  const removeOne = (id: string) => {
    const next = links.filter((l) => l.id !== id);
    setLinks(next);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  };

  return (
    <section className="space-y-3">
      {/* ⬇️ Removed duplicate header "Your Recent Links" */}

      <div className="flex items-center gap-3">
        <button
          onClick={refresh}
          className="rounded bg-gray-200 px-2 py-1 text-sm hover:bg-gray-300"
        >
          Refresh
        </button>
        <span className="text-xs opacity-60">{links.length} total</span>
      </div>

      {links.length === 0 ? (
        <div className="rounded border p-4 text-sm opacity-70">
          No recent links yet. Generate one to see it here.
        </div>
      ) : (
        <ul className="space-y-2">
          {links.map((l) => (
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
                  onClick={() => openShort(l.shortUrl)}
                  className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
                >
                  Open Short
                </button>
                <button
                  onClick={() => copyShort(l.shortUrl)}
                  className="rounded bg-gray-800 px-3 py-1.5 text-white hover:bg-black"
                >
                  Copy Short
                </button>
                <button
                  onClick={() => removeOne(l.id)}
                  className="rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
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
