// app/components/recentLinks.ts
"use client";

// Shared localStorage utils for “recent links” (used by CompactRecent + others)

export type RecentLink = {
  id: string;
  shortUrl: string;
  destinationUrl: string;
  merchant?: string | null;
  createdAt?: number;   // epoch ms
  pinned?: boolean;
};

const KEY_V1 = "recent-links";
const KEY_V2 = "recent-links:v2";

function parseList(raw: string | null): RecentLink[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as RecentLink[]) : [];
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
  for (const it of v1) map.set(it.id, it);
  for (const it of v2) map.set(it.id, it); // v2 overwrites v1
  return Array.from(map.values());
}

function sortLinks(a: RecentLink, b: RecentLink) {
  const pinDelta = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
  if (pinDelta !== 0) return pinDelta;
  return (b.createdAt ?? 0) - (a.createdAt ?? 0);
}

export function loadRecentLinks(): RecentLink[] {
  if (typeof window === "undefined") return [];
  const v2 = parseList(localStorage.getItem(KEY_V2));
  const v1 = parseList(localStorage.getItem(KEY_V1));
  const merged = mergePreferV2(v1, v2);
  return normalize(merged).sort(sortLinks);
}

export function saveRecentLinks(list: RecentLink[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY_V2, JSON.stringify(normalize(list).sort(sortLinks)));
    window.dispatchEvent(new Event("lm-recent-links-changed"));
  } catch (e) {
    console.warn("recentLinks: save failed", e);
  }
}

export function clearRecentLinks() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY_V1);
    localStorage.removeItem(KEY_V2);
    window.dispatchEvent(new Event("lm-recent-links-changed"));
  } catch (e) {
    console.warn("recentLinks: clear failed", e);
  }
}

export function addRecentLink(entry: RecentLink) {
  const list = loadRecentLinks();
  const map = new Map(list.map((x) => [x.id, x]));
  map.set(entry.id, { ...entry, createdAt: entry.createdAt ?? Date.now() });
  saveRecentLinks(Array.from(map.values()).slice(0, 20));
}
