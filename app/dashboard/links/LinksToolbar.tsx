// app/dashboard/links/LinksToolbar.tsx
"use client";

import Link from "next/link";

export default function LinksToolbar() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Primary actions */}
      <Link
        href="/dashboard/create-link"
        className="rounded-md border px-3 py-1.5 text-sm shadow-sm hover:bg-emerald-50 border-emerald-200 text-emerald-700"
        aria-label="Create Smart Link"
      >
        Create Smart Link
      </Link>
      <Link
        href="/dashboard/merchants"
        className="rounded-md border px-3 py-1.5 text-sm shadow-sm hover:bg-blue-50 border-blue-200 text-blue-700"
        aria-label="Explore Merchants"
      >
        Explore Merchants
      </Link>
      <Link
        href="/dashboard/merchants/ai"
        className="rounded-md border px-3 py-1.5 text-sm shadow-sm hover:bg-purple-50 border-purple-200 text-purple-700"
        aria-label="AI Suggestions (beta)"
      >
        AI Suggestions (beta)
      </Link>
      <Link
        href="/dashboard"
        className="rounded-md border px-3 py-1.5 text-sm shadow-sm hover:bg-gray-50 border-gray-200 text-gray-700"
        aria-label="Back to Dashboard"
      >
        Dashboard
      </Link>

      {/* Divider */}
      <span className="mx-1 hidden h-5 w-px bg-gray-200 sm:inline-block" aria-hidden />

      {/* Page-level list controls (dispatch events that RecentLinksClient listens for) */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("recent-links:refresh"))}
        className="rounded-md border px-3 py-1.5 text-sm shadow-sm hover:bg-gray-50"
        aria-label="Refresh list"
      >
        Refresh list
      </button>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("recent-links:clear"))}
        className="rounded-md border px-3 py-1.5 text-sm shadow-sm hover:bg-gray-50"
        aria-label="Clear list"
      >
        Clear list
      </button>
    </div>
  );
}
