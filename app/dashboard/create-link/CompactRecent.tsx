"use client";

import { useEffect, useState } from "react";

type RecentLink = {
  id: string;
  shortUrl: string;
  merchant?: string;
  destinationUrl: string;
  createdAt?: number;
  pinned?: boolean;
};

const KEY_V2 = "recent-links:v2";
const KEY_V1 = "recent-links";

function read(key: string): RecentLink[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as RecentLink[]) : [];
  } catch {
    return [];
  }
}

function normalize(items: RecentLink[]): RecentLink[] {
  return items.map((x) => ({
    ...x,
    createdAt: typeof x.createdAt === "number" ? x.createdAt : Date.now(),
    pinned: typeof x.pinned === "boolean" ? x.pinned : false,
  }));
}

function mergePreferV2(v1: RecentLink[], v2: RecentLink[]): RecentLink[] {
  const map = new Map<string, RecentLink>();
  for (const it of v1) map.set(it.id, it);   // write v1 first
  for (const it of v2) map.set(it.id, it);   // overwrite with v2 (preferred)
  return Array.from(map.values());
}

function mergeAndSort(): RecentLink[] {
  const v2 = read(KEY_V2);
  const v1 = read(KEY_V1);
  const arr = normalize(mergePreferV2(v1, v2));
  arr.sort((a, b) => {
    const pinDelta = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
    if (pinDelta !== 0) return pinDelta;
    return (b.createdAt! - a.createdAt!);
  });
  return arr;
}

function writeV2(items: RecentLink[]) {
  localStorage.setItem(KEY_V2, JSON.stringify(items));
}

function broadcastChange() {
  window.dispatchEvent(new Event("lm-recent-links-changed"));
}

export default function CompactRecent() {
  const [items, setItems] = useState<RecentLink[]>([]);
  const [notice, setNotice] = useState<string>("");

  const refresh = () => setItems(mergeAndSort().slice(0, 5));

  useEffect(() => {
    refresh();
    const onCustom = () => refresh();
    window.addEventListener("lm-recent-links-changed", onCustom as EventListener);
    return () => window.removeEventListener("lm-recent-links-changed", onCustom as EventListener);
  }, []);

  const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Copied!");
      setTimeout(() => setNotice(""), 900);
    } catch {
      prompt("Copy this link:", url);
    }
  };

  const togglePin = (id: string) => {
    const full = mergeAndSort();
    const next = full.map((x) => (x.id === id ? { ...x, pinned: !x.pinned } : x));
    writeV2(next);
    broadcastChange();
    setNotice(next.find(x => x.id === id)?.pinned ? "Pinned" : "Unpinned");
    setTimeout(() => setNotice(""), 900);
    refresh();
  };

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">Recent (last 5)</div>
        <div className="text-xs opacity-60">{notice || " "}</div>
      </div>
      <ul className="space-y-2">
        {items.map((l) => (
          <li key={l.id} className="rounded border p-3">
            <div className="text-sm font-medium flex items-center gap-2">
              {l.pinned && (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] text-yellow-800">
                  ★ Pinned
                </span>
              )}
              <span className="truncate">
                {l.merchant ? `${l.merchant} · ` : ""}
                <span className="opacity-70">ID:</span> {l.id}
              </span>
            </div>
            <div className="text-xs opacity-80 truncate">Short: {l.shortUrl}</div>
            <div className="text-xs opacity-80 truncate">Dest: {l.destinationUrl}</div>
            <div className="mt-1 text-xs">
              <span className="opacity-60">Created:</span>{" "}
              <span className="font-medium">
                {new Date(l.createdAt ?? Date.now()).toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => togglePin(l.id)}
                className="rounded border px-2 py-1 text-xs hover:bg-yellow-50"
                title={l.pinned ? "Unpin" : "Pin"}
              >
                {l.pinned ? "Unpin" : "Pin"}
              </button>
              <button
                type="button"
                onClick={() => open(l.shortUrl)}
                className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
                title="Open short link"
              >
                Open
              </button>
              <button
                type="button"
                onClick={() => copy(l.shortUrl)}
                className="rounded bg-gray-800 px-2 py-1 text-xs text-white"
                title="Copy short link"
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
