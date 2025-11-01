// app/components/RecentLinksClient.tsx
"use client";

import { useEffect, useState } from "react";

type RecentLink = {
  id: string;
  shortUrl: string;
  merchant?: string | null;
  destinationUrl: string;
  createdAt: number; // epoch ms
};

const LS_KEY = "recent-links";

function loadLinks(): RecentLink[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    // basic shape check
    return arr.filter(
      (x) =>
        x &&
        typeof x.id === "string" &&
        typeof x.shortUrl === "string" &&
        typeof x.destinationUrl === "string" &&
        typeof x.createdAt === "number"
    );
  } catch {
    return [];
  }
}

function saveLinks(next: RecentLink[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export default function RecentLinksClient() {
  const [links, setLinks] = useState<RecentLink[]>([]);

  useEffect(() => {
    setLinks(loadLinks());
    // watch for writes from other tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY) setLinks(loadLinks());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function remove(id: string) {
    const next = links.filter((l) => l.id !== id);
    setLinks(next);
    saveLinks(next);
  }

  function edit(id: string) {
    const cur = links.find((l) => l.id === id);
    if (!cur) return;
    const nextUrl = prompt("Update destination URL:", cur.destinationUrl);
    if (!nextUrl) return;
    try {
      new URL(nextUrl);
    } catch {
      alert("Please enter a valid URL (https://...)");
      return;
    }
    const next = links.map((l) =>
      l.id === id ? { ...l, destinationUrl: nextUrl } : l
    );
    setLinks(next);
    saveLinks(next);
  }

  function openProduct(url: string) {
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // fallback no-op
    }
  }

  if (!links.length) {
    return (
      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Your Recent Links</h2>
        <p className="text-sm opacity-70 mt-1">
          You don’t have any saved links yet. Create one from{" "}
          <a href="/dashboard/create-link" className="text-blue-600 underline">
            Create Smart Link
          </a>
          .
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border p-4">
      <h2 className="text-lg font-semibold mb-3">Your Recent Links</h2>

      <ul className="space-y-3">
        {links
          .slice()
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((r) => (
            <li
              key={r.id}
              className="rounded-md border p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {r.merchant || "Unknown merchant"}
                </div>
                <div className="text-xs opacity-70 truncate">
                  {r.destinationUrl}
                </div>
                <div className="text-[11px] opacity-60">
                  Created {new Date(r.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                {/* Open Short as a real anchor */}
                <a
                  href={r.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
                  title="Opens the short link"
                >
                  Open Short
                </a>

                <button
                  className="rounded bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
                  onClick={() => openProduct(r.destinationUrl)}
                  title="Opens the original product page"
                >
                  Open Product
                </button>

                <button
                  className="rounded bg-amber-600 px-3 py-1.5 text-white hover:bg-amber-700"
                  onClick={() => edit(r.id)}
                  title="Edit the destination URL"
                >
                  Edit
                </button>

                <button
                  className="rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
                  onClick={() => remove(r.id)}
                  title="Remove from your recent list"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
      </ul>
    </section>
  );
}
