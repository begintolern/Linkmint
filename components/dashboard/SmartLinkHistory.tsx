// components/dashboard/SmartLinkHistory.tsx
"use client";

import { useEffect, useState } from "react";

type SmartLink = {
  id: string;
  merchantName: string;
  originalUrl: string;
  shortUrl: string;
  createdAt: string;
};

export default function SmartLinkHistory() {
  const [links, setLinks] = useState<SmartLink[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchLinks(cursor?: string) {
    setLoading(true);
    const base = "/api/smartlinks/history?limit=5"; // ↓ page size = 5 for easier testing
    const qs = cursor ? `${base}&cursor=${cursor}` : base;
    const res = await fetch(qs);
    const data = await res.json();
    if (cursor) {
      setLinks((prev) => [...prev, ...data.links]);
    } else {
      setLinks(data.links);
    }
    setNextCursor(data.nextCursor || null);
    setLoading(false);
  }

  useEffect(() => {
    const refresh = () => fetchLinks();
    refresh(); // initial
    window.addEventListener("smartlink:created", refresh);
    return () => window.removeEventListener("smartlink:created", refresh);
  }, []);

  if (!links.length) {
    return <div className="text-sm text-gray-500 mt-3">No smart links yet.</div>;
  }

  return (
    <div className="mt-6 space-y-3">
      <h3 className="font-semibold">Recent Smart Links</h3>
      {links.map((l) => (
        <div key={l.id} className="rounded border p-3 flex justify-between">
          <div className="min-w-0">
            <div className="font-medium truncate">{l.merchantName}</div>
            <div className="text-xs text-gray-500">
              {new Date(l.createdAt).toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 truncate">{l.originalUrl}</div>
          </div>
          <div className="flex gap-2">
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

      <div className="flex items-center gap-3">
        {nextCursor ? (
          <button
            onClick={() => fetchLinks(nextCursor!)}
            disabled={loading}
            className="mt-3 rounded border px-3 py-1 text-sm"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        ) : (
          <div className="mt-3 text-xs text-gray-500">No more results.</div>
        )}
      </div>
    </div>
  );
}

