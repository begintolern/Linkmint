// app/components/RecentLinksClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type RecentLink = {
  id: string;
  url: string;
  createdAt: string;
};

/** ✅ Helper used by CreateLinkPage to save a new link */
export function addRecentLink(url: string) {
  if (!url) return;
  const newLink = {
    id: Math.random().toString(36).substring(2, 9),
    url,
    createdAt: new Date().toISOString(),
  };
  try {
    const stored = localStorage.getItem("recentLinks");
    const parsed = stored ? JSON.parse(stored) : [];
    const updated = [newLink, ...parsed].slice(0, 10);
    localStorage.setItem("recentLinks", JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export default function RecentLinksClient() {
  const [links, setLinks] = useState<RecentLink[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("recentLinks");
      if (stored) setLinks(JSON.parse(stored));
    } catch {
      /* ignore */
    }
  }, []);

  if (links.length === 0) {
    return (
      <section className="rounded-2xl border bg-white p-4 sm:p-5">
        <h2 className="text-base font-medium sm:text-lg">Your recent links</h2>
        <p className="mt-2 text-sm text-gray-600">
          You haven’t created any smart links yet. Try generating one to see it here.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border bg-white p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium sm:text-lg">Your recent links</h2>
        <button
          onClick={() => {
            localStorage.removeItem("recentLinks");
            setLinks([]);
          }}
          className="text-xs text-red-600 hover:underline"
        >
          Clear All
        </button>
      </div>

      <ul className="divide-y text-sm">
        {links.map((link) => (
          <li
            key={link.id}
            className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="truncate">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate block"
              >
                {link.url}
              </a>
              <p className="text-xs text-gray-500">
                Created {new Date(link.createdAt).toLocaleString()}
              </p>
            </div>
            <Link
              href={`/dashboard/create-link?url=${encodeURIComponent(link.url)}`}
              className="text-xs text-gray-700 hover:text-gray-900 mt-1 sm:mt-0"
            >
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
