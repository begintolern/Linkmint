"use client";

import { useEffect, useState } from "react";

type RecentLink = {
  id: string;
  shortUrl: string;
  merchant: string;
  destinationUrl: string;
  createdAt: number;
};

export default function RecentLocalLinks() {
  const [items, setItems] = useState<RecentLink[]>([]);
  const [debug, setDebug] = useState<string>("");

  function load() {
    try {
      const raw = localStorage.getItem("recent-links") || "[]";
      const arr = JSON.parse(raw) as RecentLink[];
      // newest first
      arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setItems(arr);
      setDebug(`Loaded ${arr.length} from localStorage`);
    } catch (e) {
      console.error("recent-links parse error", e);
      setItems([]);
      setDebug("Parse error; showing 0");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openShort(u: string) {
    try {
      // Use window.open directly with the url passed in
      window.open(u, "_blank");
    } catch (e) {
      console.error("openShort error", e);
      alert("Couldn't open the short link.");
    }
  }

  function openProduct(u: string) {
    try {
      window.open(u, "_blank");
    } catch (e) {
      console.error("openProduct error", e);
    }
  }

  function removeAt(idx: number) {
    try {
      const raw = localStorage.getItem("recent-links") || "[]";
      const arr = JSON.parse(raw) as RecentLink[];
      arr.splice(idx, 1);
      localStorage.setItem("recent-links", JSON.stringify(arr));
      load();
    } catch (e) {
      console.error("removeAt error", e);
    }
  }

  function editAt(idx: number) {
    try {
      const raw = localStorage.getItem("recent-links") || "[]";
      const arr = JSON.parse(raw) as RecentLink[];
      const cur = arr[idx];
      if (!cur) return;

      const next = prompt("Update destination URL:", cur.destinationUrl);
      if (!next) return;

      arr[idx] = { ...cur, destinationUrl: next };
      localStorage.setItem("recent-links", JSON.stringify(arr));
      load();
    } catch (e) {
      console.error("editAt error", e);
    }
  }

  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center gap-3">
        <h2 className="text-lg font-semibold">Your Recent Links</h2>
        <button
          onClick={load}
          className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
          title="Reload from localStorage"
        >
          Refresh
        </button>
        <span className="text-xs text-gray-500">{debug}</span>
      </div>

      {items.length === 0 ? (
        <div className="rounded border p-4 text-sm text-gray-600">
          No recent links yet. Create one on the “Create Smart Link” page.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((it, idx) => (
            <li
              key={`${it.id}-${idx}`}
              className="flex flex-col gap-2 rounded border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {it.merchant} · {it.shortUrl}
                </div>
                <div className="truncate text-xs text-gray-500">
                  → {it.destinationUrl}
                </div>
                <div className="text-xs text-gray-400">
                  Created {new Date(it.createdAt || Date.now()).toLocaleString()}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => openShort(it.shortUrl)}
                  className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
                  title="Open the short link"
                >
                  Open Short
                </button>
                <button
                  onClick={() => openProduct(it.destinationUrl)}
                  className="rounded bg-green-600 px-3 py-1.5 text-white hover:bg-green-700"
                  title="Open the product page"
                >
                  Open Product
                </button>
                <button
                  onClick={() => editAt(idx)}
                  className="rounded bg-yellow-500 px-3 py-1.5 text-white hover:bg-yellow-600"
                  title="Edit destination URL"
                >
                  Edit
                </button>
                <button
                  onClick={() => removeAt(idx)}
                  className="rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
                  title="Remove from recent"
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
