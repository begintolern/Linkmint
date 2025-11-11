// app/dashboard/links/LinksHistoryClient.tsx
"use client";

import { useEffect, useState } from "react";

type Row = { id: string; title?: string | null; url?: string | null; createdAt?: string };

export default function LinksHistoryClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch("/api/smartlinks/history", {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { success: boolean; links: Row[] };
        if (!abort) setRows(Array.isArray(json.links) ? json.links : []);
      } catch (e) {
        if (!abort) setErr("LOAD_FAIL");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, []);

  if (loading) return <div className="text-sm opacity-70">Loading history…</div>;
  if (err) return <div className="text-sm text-rose-700">Couldn’t load history.</div>;
  if (rows.length === 0) {
    return <div className="rounded border p-3 text-sm opacity-70">No links found in your account yet.</div>;
  }

  return (
    <ul className="divide-y rounded border">
      {rows.map((r) => (
        <li key={r.id} className="p-3">
          <div className="text-sm font-medium truncate">ID: {r.id}</div>
          {r.url ? (
            <div className="truncate text-xs">
              <span className="opacity-60">Dest: </span>
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="underline">
                {r.url}
              </a>
            </div>
          ) : null}
          <div className="text-xs opacity-70">
            Created: {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
          </div>
        </li>
      ))}
    </ul>
  );
}
