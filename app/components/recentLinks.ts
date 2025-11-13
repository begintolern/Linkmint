// app/components/recentLinks.ts
"use client";

import { useEffect, useState } from "react";

type RecentLink = {
  id: string;
  shortUrl?: string | null;
  originalUrl?: string | null;
  merchantName?: string | null;
  createdAt?: string;
};

export default function RecentLinks({ limit = 10 }: { limit?: number }) {
  const [links, setLinks] = useState<RecentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setError(null);
        setLoading(true);

        const res = await fetch("/api/links", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        let items: RecentLink[] = Array.isArray(data?.links) ? data.links : [];

        // Take newest first if API already sorts that way, just slice
        if (limit && items.length > limit) {
          items = items.slice(0, limit);
        }

        if (!cancelled) {
          setLinks(items);
        }
      } catch (e) {
        if (!cancelled) {
          setError("Could not load recent links.");
          setLinks([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (loading && links.length === 0) {
    return (
      <div className="text-xs sm:text-sm text-gray-500">
        Loading recent links…
      </div>
    );
  }

  if (error && links.length === 0) {
    return (
      <div className="text-xs sm:text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!loading && links.length === 0) {
    return (
      <div className="text-xs sm:text-sm text-gray-500">
        You haven&apos;t created any links yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {links.map((link) => {
        const dest = link.originalUrl || link.shortUrl || "";
        let host = "";
        try {
          host = dest ? new URL(dest).hostname.replace(/^www\./, "") : "";
        } catch {
          host = "";
        }

        const smartPath = `/l/${link.id}`;
        const smartLabel = `linkmint.co${smartPath}`;

        return (
          <div
            key={link.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  {link.merchantName || host || "Merchant"}
                </span>
              </div>
              {dest && (
                <div className="mt-0.5 text-[11px] sm:text-xs text-slate-500 truncate">
                  {dest}
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              <a
                href={smartPath}
                className="text-[11px] sm:text-xs text-emerald-700 hover:text-emerald-800 hover:underline break-all"
                title={smartLabel}
              >
                {smartLabel}
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
