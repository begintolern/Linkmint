// app/components/RecentLinksClient.tsx
"use client";

import { useEffect, useState } from "react";

type LinkItem = {
  id: string;
  shortUrl: string;
  merchant: string;
  destinationUrl: string;
  createdAt: number;
};

export default function RecentLinksClient() {
  const [links, setLinks] = useState<LinkItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("recentLinks");
      if (stored) setLinks(JSON.parse(stored));
    } catch (err) {
      console.error("Failed to parse recentLinks:", err);
    }
  }, []);

  function handleOpen(link: LinkItem) {
    window.open(link.shortUrl, "_blank", "noopener,noreferrer");
  }

  function handleRemove(id: string) {
    const updated = links.filter((l) => l.id !== id);
    setLinks(updated);
    localStorage.setItem("recentLinks", JSON.stringify(updated));
  }

  if (links.length === 0) {
    return (
      <div className="text-sm opacity-70 mt-6">
        You haven’t created any smart links yet.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-lg font-semibold">Your Recent Links</h2>
      <ul className="space-y-3">
        {links.map((l) => (
          <li
            key={l.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between rounded border p-3 gap-2"
          >
            <div className="flex-1">
              <div className="font-medium">{l.merchant}</div>
              <div className="text-xs break-all opacity-80">
                {l.destinationUrl}
              </div>
              <div className="text-xs opacity-60">
                Created {new Date(l.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="flex gap-2">
              {/* Proper link element instead of button */}
              <a
                href={l.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-blue-600 px-3 py-1 text-white text-sm hover:bg-blue-700"
              >
                Open
              </a>

              <button
                onClick={() => navigator.clipboard.writeText(l.shortUrl)}
                className="rounded bg-gray-600 px-3 py-1 text-white text-sm hover:bg-gray-700"
              >
                Copy
              </button>

              <button
                onClick={() => handleRemove(l.id)}
                className="rounded bg-red-600 px-3 py-1 text-white text-sm hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
