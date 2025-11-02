"use client";

import { useEffect, useState } from "react";

type RecentLink = {
  id: string;
  shortUrl: string;
  merchant?: string;
  destinationUrl: string;
  createdAt?: number;
};

const KEY_V2 = "recent-links:v2";
const KEY_V1 = "recent-links";

function load(): RecentLink[] {
  const read = (k: string) => {
    try {
      const raw = localStorage.getItem(k);
      return raw ? (JSON.parse(raw) as RecentLink[]) : [];
    } catch {
      return [];
    }
  };
  const v2 = read(KEY_V2);
  const v1 = read(KEY_V1);
  const map = new Map<string, RecentLink>();
  [...v2, ...v1].forEach((x) => map.set(x.id, x));
  const arr = Array.from(map.values()).map((x) => ({
    ...x,
    createdAt: typeof x.createdAt === "number" ? x.createdAt : Date.now(),
  }));
  return arr.sort((a, b) => (b.createdAt! - a.createdAt!)).slice(0, 5);
}

export default function CompactRecent() {
  const [items, setItems] = useState<RecentLink[]>([]);

  useEffect(() => {
    setItems(load());
    const onCustom = () => setItems(load());
    window.addEventListener("lm-recent-links-changed", onCustom as EventListener);
    return () => window.removeEventListener("lm-recent-links-changed", onCustom as EventListener);
  }, []);

  const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      prompt("Copy this link:", url);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-2 text-sm font-semibold">Recent (last 5)</div>
      <ul className="space-y-2">
        {items.map((l) => (
          <li key={l.id} className="rounded border p-3">
            <div className="text-sm font-medium">
              {l.merchant ? `${l.merchant} · ` : ""}
              <span className="opacity-70">ID:</span> {l.id}
            </div>
            <div className="text-xs opacity-80 truncate">Short: {l.shortUrl}</div>
            <div className="text-xs opacity-80 truncate">Dest: {l.destinationUrl}</div>
            {/* Timestamp */}
            <div className="mt-1 text-xs">
              <span className="opacity-60">Created:</span>{" "}
              <span className="font-medium">
                {new Date(l.createdAt ?? Date.now()).toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => open(l.shortUrl)}
                className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
              >
                Open
              </button>
              <button
                type="button"
                onClick={() => copy(l.shortUrl)}
                className="rounded bg-gray-800 px-2 py-1 text-xs text-white"
              >
                Copy
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
