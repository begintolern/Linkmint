// app/components/RecentLinksClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SmartLink = {
  id: string;
  shortUrl?: string | null;
  merchantName?: string | null;
  label?: string | null;
  createdAt?: string | null;
};

type ApiResponse = {
  ok: boolean;
  links?: SmartLink[];
  error?: string;
};

export default function RecentLinksClient() {
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

  if (loading && !error) {
    return (
      <section className="card mt-4">
        <h2 className="text-base sm:text-lg font-semibold mb-2">
          Your recent links
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Quick access to the links you just created.
        </p>
        <div className="h-24 grid place-items-center text-sm text-gray-500">
          Loading…
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card mt-4">
        <h2 className="text-base sm:text-lg font-semibold mb-2">
          Your recent links
        </h2>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 text-sm">
          {error}
        </div>
      </section>
    );
  }

  if (!links.length) {
    return (
      <section className="card mt-4">
        <h2 className="text-base sm:text-lg font-semibold mb-2">
          Your recent links
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Quick access to the links you just created.
        </p>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
          You haven’t created any links yet. Create a{" "}
          <Link href="/dashboard/create-link" className="underline">
            smart link
          </Link>{" "}
          to see it here.
        </div>
      </section>
    );
  }

  return (
    <section className="card mt-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 className="text-base sm:text-lg font-semibold">
          Your recent links
        </h2>
        <Link
          href="/dashboard/links"
          className="text-xs sm:text-sm text-emerald-700 hover:text-emerald-800 underline"
        >
          View all
        </Link>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Tap a short link to open it, or copy to share.
      </p>

      <ul className="space-y-3">
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

          const shortPath = `/l/${l.id}`;
          const origin =
            typeof window !== "undefined" ? window.location.origin : "";
          const fullShort = origin ? `${origin}${shortPath}` : shortPath;

          return (
            <li
              key={l.id}
              className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4"
            >
              {/* Top row: merchant + label + date */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
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

              {/* Short link line */}
              <button
                type="button"
                onClick={() => window.open(shortPath, "_blank", "noopener")}
                className="mt-2 w-full text-left text-xs font-mono text-emerald-700 break-all underline-offset-2 hover:underline"
              >
                {fullShort}
              </button>

              {/* Actions */}
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() =>
                    window.open(shortPath, "_blank", "noopener")
                  }
                  className="btn-primary text-xs sm:text-sm w-full sm:w-auto justify-center"
                >
                  Open short
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(fullShort)}
                  className="btn-secondary text-xs sm:text-sm w-full sm:w-auto justify-center"
                >
                  Copy short
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
