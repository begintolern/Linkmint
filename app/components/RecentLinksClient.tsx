"use client";

import { useEffect, useState } from "react";

type RecentLink = {
  id: string;
  shortUrl: string;         // e.g., "https://lm.to/abc123?t=...&m=..."
  merchant?: string;
  destinationUrl?: string;
  createdAt?: number;
};

const STORAGE_KEY = "recent-links";

function safeHref(u: string): string {
  if (!u) return "";
  return u.startsWith("http://") || u.startsWith("https://") ? u : `https://${u}`;
}

export default function RecentLinksClient() {
  const [links, setLinks] = useState<RecentLink[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as RecentLink[];
        setLinks(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      setLinks([]);
    }
  }, []);

  async function handleRemove(id: string) {
    const next = links.filter((l) => l.id !== id);
    setLinks(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  function handleOpenShort(url: string) {
    const href = safeHref(url);
    // Fallback open in new tab if anchor fails for any reason
    window.open(href, "_blank", "noopener,noreferrer");
  }

  if (!links.length) {
    return (
      <div className="rounded-md border p-4">
        <div className="font-medium">Your Recent Links</div>
        <div className="text-sm opacity-70 mt-1">No links yet.</div>
      </div>
    );
  }

  return (
    <div className="rounded-md border p-4">
      <div className="font-medium mb-3">Your Recent Links</div>
      <ul className="space-y-3">
        {links.map((link) => {
          const href = safeHref(link.shortUrl);
          const created =
            link.createdAt ? new Date(link.createdAt).toLocaleString() : "";

          return (
            <li
              key={link.id}
              className="flex flex-col gap-2 rounded border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">
                  {link.merchant || "Smart Link"} · {link.id}
                </div>
                <div className="text-xs opacity-70 truncate">
                  Short: {href}
                </div>
                {link.destinationUrl && (
                  <div className="text-xs opacity-70 truncate">
                    To: {link.destinationUrl}
                  </div>
                )}
                {created && (
                  <div className="text-xs opacity-60">Created {created}</div>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                {/* Preferred: real anchor with full absolute URL */}
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
                  title="Opens the short link"
                >
                  Open Short
                </a>

                {/* JS fallback in case the anchor is somehow overridden */}
                <button
                  type="button"
                  onClick={() => handleOpenShort(href)}
                  className="rounded border px-3 py-1.5 hover:bg-gray-50"
                  title="Fallback open"
                >
                  Open (Fallback)
                </button>

                {/* Copy short URL */}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(href);
                      alert("Short link copied!");
                    } catch {
                      alert("Could not copy link.");
                    }
                  }}
                  className="rounded border px-3 py-1.5 hover:bg-gray-50"
                  title="Copy short link"
                >
                  Copy
                </button>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => handleRemove(link.id)}
                  className="rounded border px-3 py-1.5 hover:bg-red-50"
                  title="Remove from list"
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
