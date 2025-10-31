// app/dashboard/links/RecentLocalLinks.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type RecentLink = {
  id?: string;
  shortUrl?: string | null;
  destinationUrl?: string | null;
  merchant?: string | null;
  createdAt?: number; // ms epoch
};

const STORAGE_KEY = "recent-links";

function loadLinks(): RecentLink[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // normalize
    return parsed.map((x: any) => ({
      id: x?.id ?? undefined,
      shortUrl: x?.shortUrl ?? null,
      destinationUrl: x?.destinationUrl ?? null,
      merchant: x?.merchant ?? null,
      createdAt: typeof x?.createdAt === "number" ? x.createdAt : Date.now(),
    }));
  } catch {
    return [];
  }
}

function saveLinks(list: RecentLink[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function hostnameOf(url?: string | null) {
  if (!url) return "";
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export default function RecentLocalLinks() {
  const [links, setLinks] = useState<RecentLink[]>([]);

  useEffect(() => {
    setLinks(loadLinks());
  }, []);

  const sorted = useMemo(() => {
    return [...links].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }, [links]);

  function handleOpen(l: RecentLink) {
    // Prefer a real product URL; fall back to shortUrl if it’s not lm.to
    const shortHost = hostnameOf(l.shortUrl);
    const useDestination =
      !!l.destinationUrl && (!l.shortUrl || shortHost === "lm.to");

    const urlToOpen = useDestination ? l.destinationUrl! : l.shortUrl!;
    try {
      window.open(urlToOpen, "_blank", "noopener,noreferrer");
    } catch {
      // no-op
    }
  }

  function handleRemove(idx: number) {
    const next = [...sorted];
    next.splice(idx, 1);
    setLinks(next);
    saveLinks(next);
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border p-4">
        <div className="font-medium mb-1">Your Recent Links</div>
        <div className="text-sm opacity-70">
          No links yet. Create one from{" "}
          <Link className="underline" href="/dashboard/create-link">
            Create Smart Link
          </Link>
          .
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="font-medium">Your Recent Links</div>
      <ul className="space-y-2">
        {sorted.map((l, i) => {
          const shortHost = hostnameOf(l.shortUrl);
          const willUseDestination =
            !!l.destinationUrl && (!l.shortUrl || shortHost === "lm.to");
          const openLabel = willUseDestination ? "Open Product" : "Open Short";

          return (
            <li
              key={(l.id ?? "") + (l.createdAt ?? i)}
              className="flex flex-col gap-1 rounded border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="truncate">
                  <span className="text-sm font-medium">
                    {l.merchant || "Smart Link"}
                  </span>
                  {" · "}
                  <span className="text-xs opacity-70">
                    {new Date(l.createdAt ?? Date.now()).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs opacity-80 truncate">
                  {willUseDestination ? l.destinationUrl : l.shortUrl}
                </div>
              </div>

              <div className="flex gap-2 pt-2 sm:pt-0">
                <button
                  onClick={() => handleOpen(l)}
                  className="rounded bg-blue-600 px-3 py-1.5 text-white text-sm hover:bg-blue-700"
                  title={
                    willUseDestination
                      ? "Opens original product URL (fallback because lm.to is a placeholder)"
                      : "Opens the short link"
                  }
                >
                  {openLabel}
                </button>

                <Link
                  href={`/dashboard/create-link?url=${encodeURIComponent(
                    (l.destinationUrl || l.shortUrl || "").toString()
                  )}`}
                  className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Edit
                </Link>

                <button
                  onClick={() => handleRemove(i)}
                  className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="text-xs opacity-60">
        Note: <code>lm.to</code> is a placeholder. Until your short domain is
        live, the Open button will use the original product URL.
      </div>
    </div>
  );
}
