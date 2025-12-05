"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SmartLink = {
  id: string;
  shortUrl?: string | null; // stored affiliate URL (Zalora, Lazada, etc.)
  merchantName?: string | null;
  label?: string | null;
  createdAt?: string | null;
};

type ApiResponse = {
  ok: boolean;
  links?: SmartLink[];
  error?: string;
};

export default function CompactRecent() {
  const [links, setLinks] = useState<SmartLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/links", { cache: "no-store" });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `HTTP ${res.status}`);
        }
        const json = (await res.json()) as ApiResponse;
        if (!json.ok) throw new Error(json.error || "Failed to load links");

        if (!cancelled) {
          const sorted = (json.links ?? []).sort((a, b) => {
            const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bt - at;
          });
          setLinks(sorted.slice(0, 5));
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e?.message?.includes("401")
              ? "You’re not signed in. Please log in to view your links."
              : e?.message || "Failed to load recent links."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      alert("Unable to copy automatically. Please copy the link manually.");
    }
  }

  const renderBody = () => {
    if (loading && !error) {
      return (
        <div className="h-24 grid place-items-center text-xs text-gray-500">
          Loading…
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
          {error}
        </div>
      );
    }

    if (!links.length) {
      return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600">
          No recent links yet. Your last few links will show up here for quick
          access.
        </div>
      );
    }

    const origin =
      typeof window !== "undefined" ? window.location.origin : "";

    return (
      <ul className="space-y-2">
        {links.map((l) => {
          const created =
            l.createdAt && !Number.isNaN(Date.parse(l.createdAt))
              ? new Date(l.createdAt)
              : null;

          const displayDate = created
            ? created.toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Recently created";

          const merchant = l.merchantName || "Unknown merchant";
          const label = l.label || "";

          // ✅ Our user-facing short path
          const shortPath = `/l/${l.id}`;
          const fullShort = origin ? `${origin}${shortPath}` : shortPath;

          return (
            <li
              key={l.id}
              className="rounded-xl border border-gray-200 bg-white p-2 sm:p-3"
            >
              {/* Top row: merchant + label + date */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">
                    {merchant}
                  </div>
                  {label && (
                    <div className="text-xs text-gray-500 truncate">
                      {label}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 sm:text-right">
                  {displayDate}
                </div>
              </div>

              {/* Short URL line */}
              <button
                type="button"
                onClick={() =>
                  window.open(shortPath, "_blank", "noopener,noreferrer")
                }
                className="mt-1 w-full text-left text-xs font-mono text-emerald-700 break-all underline-offset-2 hover:underline"
              >
                {fullShort}
              </button>

              {/* Actions */}
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() =>
                    window.open(shortPath, "_blank", "noopener,noreferrer")
                  }
                  className="btn-primary text-xs w-full sm:w-auto justify-center py-1.5"
                >
                  Open short
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(fullShort)}
                  className="btn-secondary text-xs w-full sm:w-auto justify-center py-1.5"
                >
                  Copy short
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <section className="mt-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="text-sm font-semibold">Your recent links</h3>
        <Link
          href="/dashboard/links"
          className="text-xs text-emerald-700 hover:text-emerald-800 underline"
        >
          View all
        </Link>
      </div>
      <p className="text-xs text-gray-500 mb-2">
        Quick access to the last few links you created.
      </p>
      {renderBody()}
    </section>
  );
}
