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

export default function LinksTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/links/list", { cache: "no-store" });
        const json = await res.json();
        setRows(json?.links ?? []);
      } catch {
        setRows([]);
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
            <th className="p-3">Created</th>
            <th className="p-3">Short Link</th>
            <th className="p-3">Target URL</th>
            <th className="p-3">Clicks</th>
            <th className="p-3">Earnings</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td className="p-6 text-gray-500" colSpan={5}>Loading…</td></tr>
          ) : rows.length ? (
            rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-3 whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleString()}
                </td>
                <td className="p-3">
                  {r.shortUrl ? (
                    <a href={r.shortUrl} target="_blank" rel="noreferrer" className="underline">
                      {r.shortUrl}
                    </a>
                  ) : "—"}
                </td>
                <td className="p-3 max-w-[360px] truncate" title={r.targetUrl ?? ""}>
                  {r.targetUrl ?? "—"}
                </td>
                <td className="p-3">{r.clicks ?? 0}</td>
                <td className="p-3">
                  {r.earningsCents != null ? `$${(r.earningsCents/100).toFixed(2)}` : "—"}
                </td>
              </tr>
            ))
          ) : (
            <tr><td className="p-6 text-gray-500" colSpan={5}>No links yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
