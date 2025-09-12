// components/dashboard/SmartLinkHistory.tsx
"use client";

import { useEffect, useState } from "react";

type SmartLink = {
  id: string;
  merchantName: string;
  merchantDomain: string | null;
  shortUrl: string;
  originalUrl: string;
  label: string | null;
  createdAt: string;
};

export default function SmartLinkHistory() {
  const [links, setLinks] = useState<SmartLink[]>([]);

  useEffect(() => {
    fetch("/api/smartlink/history")
      .then((res) => res.json())
      .then((data) => setLinks(data.links || []))
      .catch(() => setLinks([]));
  }, []);

  if (!links.length) {
    return (
      <div className="text-sm text-gray-500 mt-3">
        No smart links yet. Create one above to get started.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <h3 className="font-semibold">Recent Smart Links</h3>
      {links.map((l) => (
        <div
          key={l.id}
          className="rounded border p-3 flex items-center justify-between"
        >
          <div className="min-w-0">
            <div className="font-medium truncate">{l.merchantName}</div>
            {l.label ? (
              <div className="text-xs text-gray-600 truncate">{l.label}</div>
            ) : null}
            <div className="text-xs text-gray-500">
              {new Date(l.createdAt).toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 truncate">
              {l.originalUrl}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => navigator.clipboard.writeText(l.shortUrl)}
              className="rounded bg-gray-900 text-white text-xs px-2 py-1"
            >
              Copy
            </button>
            <a
              href={l.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border text-xs px-2 py-1"
            >
              Open
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
