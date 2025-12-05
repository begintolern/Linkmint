export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies, headers } from "next/headers";

type SafeLink = {
  id: string;
  shortUrl: string | null;
  merchantName: string | null;
  destinationUrl: string | null;
  createdAt: string; // ISO
  clicks: number;
};

async function fetchLinks(limit = 5): Promise<SafeLink[]> {
  try {
    const hdrs = headers();
    const proto = hdrs.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
    const host =
      hdrs.get("x-forwarded-host") ??
      hdrs.get("host") ??
      process.env.NEXT_PUBLIC_VERCEL_URL ??
      "localhost:3000";

    const base = `${proto}://${host}`;
    const res = await fetch(`${base}/api/links`, {
      method: "GET",
      cache: "no-store",
      headers: { cookie: cookies().toString() },
    });

    if (!res.ok) return [];
    const data = (await res.json()) as { ok: boolean; links?: SafeLink[] };
    const all = Array.isArray(data.links) ? data.links : [];
    return all.slice(0, limit);
  } catch {
    return [];
  }
}

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

export default async function LinksCard() {
  const links = await fetchLinks(6);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">Your recent links</h3>
        <Link href="/dashboard/links" className="text-xs text-teal-700 hover:underline">
          View all
        </Link>
      </div>

      {links.length === 0 ? (
        <div className="p-6 text-sm text-gray-500">
          No links yet.{" "}
          <Link href="/dashboard/create-link" className="text-teal-700 hover:underline font-medium">
            Create your first link
          </Link>
          .
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {links.map((l) => (
            <li key={l.id} className="px-5 py-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-gray-300" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="truncate">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {l.merchantName ?? "—"}
                      </div>
                      <a
                        href={l.destinationUrl ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-xs text-gray-600 hover:text-teal-700 hover:underline"
                        title={l.destinationUrl ?? ""}
                      >
                        {l.destinationUrl ?? "—"}
                      </a>
                    </div>
                    <div className="text-right shrink-0">
                      <a
                        href={l.shortUrl ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-teal-700 hover:underline"
                      >
                        {l.shortUrl ? l.shortUrl.replace(/^https?:\/\//, "") : "—"}
                      </a>
                      <div className="text-xs text-gray-500">{timeAgo(l.createdAt)}</div>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">Clicks: {l.clicks}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
