export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies, headers } from "next/headers";

type SafeLink = {
  id: string;
  shortUrl: string | null;
  merchantName: string | null;
  originalUrl: string | null;
  destinationUrl: string | null;
  createdAt: string; // ISO
  clicks: number;
};

async function fetchLinks(): Promise<{ ok: boolean; links: SafeLink[]; status?: number }> {
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
      // Pass session cookies explicitly for SSR
      headers: { cookie: cookies().toString() },
    });

    if (!res.ok) return { ok: false, links: [], status: res.status };
    const data = (await res.json()) as { ok: boolean; links?: SafeLink[] };
    return { ok: !!data.ok, links: data.links ?? [] };
  } catch {
    return { ok: false, links: [] };
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

export default async function LinksPage() {
  const { links, ok, status } = await fetchLinks();

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Your Links</h1>
        <Link
          href="/dashboard/create-link"
          className="inline-flex items-center rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
        >
          Create Link
        </Link>
      </div>

      {!ok ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-800">
          Can’t reach the links API{status ? ` (HTTP ${status})` : ""}. Refresh the page or sign in again.
        </div>
      ) : links.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          No links yet. Click <span className="font-medium text-gray-700">Create Link</span> to make your first one.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Short</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Merchant</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Destination</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Clicks</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {links.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    {l.shortUrl ? (
                      <a href={l.shortUrl} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline">
                        {l.shortUrl.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-800">{l.merchantName ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 max-w-[520px]">
                    {l.destinationUrl ? (
                      <a
                        href={l.destinationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-gray-700 hover:text-teal-700 hover:underline block"
                        title={l.destinationUrl}
                      >
                        {l.destinationUrl}
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-800">{l.clicks}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-500">{timeAgo(l.createdAt)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
