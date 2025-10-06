// app/dashboard/admin/merchants/page.tsx
"use client";

import { useEffect, useState } from "react";

type Item = {
  key: string;
  label: string;
  country: string;
  ready: boolean;
  missingEnv: string[];
  note?: string;
  mode?: string;
};
type Health = { ok: boolean; region: string; items: Item[] };

export default function AdminMerchantsPage() {
  const [data, setData] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/merchants/health", { cache: "no-store" });
      const json = (await res.json()) as Health;
      setData(json);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Merchants (PH)</h1>
        <button
          onClick={load}
          className="rounded-xl border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Live readiness of PH marketplace connectors (env presence only).
      </p>

      {err && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Failed to load merchant health: {err}
        </div>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="px-3 py-2">Merchant</th>
              <th className="px-3 py-2">Country</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Missing env</th>
              <th className="px-3 py-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-3 py-3 text-sm" colSpan={5}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading &&
              data?.items?.map((m) => (
                <tr key={m.key} className="rounded-xl">
                  <td className="rounded-l-xl bg-white px-3 py-3 text-sm font-medium">
                    {m.label}
                  </td>
                  <td className="bg-white px-3 py-3 text-sm">{m.country}</td>
                  <td className="bg-white px-3 py-3 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                        m.ready
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {m.ready ? "Ready" : "Provisioned"}
                    </span>
                    {m.mode && (
                      <span className="ml-2 align-middle text-[11px] text-muted-foreground">
                        {m.mode}
                      </span>
                    )}
                  </td>
                  <td className="bg-white px-3 py-3 text-xs">
                    {m.ready || m.missingEnv.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <code className="rounded bg-muted px-1.5 py-0.5">
                        {m.missingEnv.join(", ")}
                      </code>
                    )}
                  </td>
                  <td className="rounded-r-xl bg-white px-3 py-3 text-xs text-muted-foreground">
                    {m.note || "—"}
                  </td>
                </tr>
              ))}
            {!loading && (data?.items?.length ?? 0) === 0 && (
              <tr>
                <td className="px-3 py-3 text-sm text-muted-foreground" colSpan={5}>
                  No merchants registered.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Tip: Add keys in your hosting env. This table will turn green automatically.
      </p>
    </div>
  );
}
