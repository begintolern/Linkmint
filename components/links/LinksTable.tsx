"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  createdAt: string;
  shortUrl: string | null;
  targetUrl: string | null;
  clicks: number | null;
  earningsCents: number | null;
};

function formatAmount(cents: number | null | undefined) {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

function hostOnly(u: string | null) {
  if (!u) return "—";
  try {
    const { host } = new URL(u);
    return host;
  } catch {
    return u;
  }
}

function compactPath(u: string | null) {
  if (!u) return "";
  try {
    const { pathname } = new URL(u);
    const path = pathname.replace(/\/$/, "");
    return path.length > 24 ? path.slice(0, 24) + "…" : path || "/";
  } catch {
    return "";
  }
}

/** External QR image service (no dependency). */
function qrThumb(url: string) {
  const data = encodeURIComponent(url);
  return `https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=${data}`;
}

export default function LinksTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // 1) Try server list
        const res = await fetch("/api/links/list", { cache: "no-store" });
        const json = await res.json();
        const serverRows: Row[] = Array.isArray(json?.links) ? json.links : [];

        // 2) Also read localStorage cache written by SmartLinkGenerator
        let localRows: Row[] = [];
        try {
          const raw = localStorage.getItem("lm_links");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              localRows = parsed.map((r: any) => ({
                id: r.id,
                createdAt: r.createdAt,
                shortUrl: r.shortUrl ?? null,
                targetUrl: r.targetUrl ?? null,
                clicks: r.clicks ?? 0,
                earningsCents: r.earningsCents ?? null,
              }));
            }
          }
        } catch {
          // ignore localStorage errors
        }

        // 3) Merge & dedupe by shortUrl (prefer server copy if both exist)
        const byKey = new Map<string, Row>();
        const add = (r: Row) => {
          const key = r.shortUrl || `local-${r.id}`;
          if (!byKey.has(key)) byKey.set(key, r);
        };
        serverRows.forEach(add);
        localRows.forEach(add);

        const merged = Array.from(byKey.values())
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
          .slice(0, 50);

        setRows(merged);
      } catch {
        // Server failed — fall back to localStorage only
        try {
          const raw = localStorage.getItem("lm_links");
          const parsed = raw ? JSON.parse(raw) : [];
          if (Array.isArray(parsed)) {
            setRows(
              parsed
                .map((r: any) => ({
                  id: r.id,
                  createdAt: r.createdAt,
                  shortUrl: r.shortUrl ?? null,
                  targetUrl: r.targetUrl ?? null,
                  clicks: r.clicks ?? 0,
                  earningsCents: r.earningsCents ?? null,
                }))
                .slice(0, 50)
            );
          } else {
            setRows([]);
          }
        } catch {
          setRows([]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="rounded-lg border bg-white overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="p-3 w-[160px]">Created</th>
            <th className="p-3">Link</th>
            <th className="p-3 w-[80px]">Clicks</th>
            <th className="p-3 w-[110px]">Earnings</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td className="p-6 text-gray-500" colSpan={4}>Loading…</td></tr>
          ) : rows.length ? (
            rows.map(r => (
              <tr key={r.id} className="border-t align-middle">
                {/* Created */}
                <td className="p-3 whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleString()}
                </td>

                {/* Link column: QR thumbnail + compact label + copy */}
                <td className="p-3">
                  {r.shortUrl ? (
                    <div className="flex items-center gap-3">
                      {/* QR image */}
                      <a href={r.shortUrl} target="_blank" rel="noreferrer" title="Open link">
                        <img
                          src={qrThumb(r.shortUrl)}
                          alt="QR"
                          className="w-10 h-10 rounded border"
                          loading="lazy"
                        />
                      </a>

                      {/* Compact label */}
                      <div className="min-w-0">
                        <a
                          href={r.shortUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block font-medium truncate max-w-[360px]"
                          title={r.shortUrl}
                        >
                          {hostOnly(r.shortUrl)}
                          <span className="text-gray-500"> {compactPath(r.shortUrl)}</span>
                        </a>
                        <div className="text-xs text-gray-500 truncate max-w-[360px]" title={r.targetUrl ?? ""}>
                          {hostOnly(r.targetUrl)} {compactPath(r.targetUrl)}
                        </div>
                      </div>

                      {/* Copy */}
                      <button
                        onClick={() => navigator.clipboard.writeText(r.shortUrl!)}
                        className="shrink-0 rounded bg-gray-800 text-white px-2 py-1 text-xs"
                        title="Copy short link"
                      >
                        Copy
                      </button>
                    </div>
                  ) : "—"}
                </td>

                {/* Clicks / Earnings */}
                <td className="p-3 text-center">{r.clicks ?? 0}</td>
                <td className="p-3">{formatAmount(r.earningsCents)}</td>
              </tr>
            ))
          ) : (
            <tr><td className="p-6 text-gray-500" colSpan={4}>No links yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
