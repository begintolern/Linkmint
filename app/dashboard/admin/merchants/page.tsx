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

type IdentifyResp =
  | { ok: true; match: null; message?: string }
  | {
      ok: true;
      match: {
        key: string;
        label: string;
        country: string;
        ready: boolean;
        missingEnv: string[];
        note?: string;
        normalizedUrl: string;
        host: string;
      };
    }
  | { ok: false; error: string };

export default function AdminMerchantsPage() {
  const [data, setData] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // quick-check widget
  const [url, setUrl] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<IdentifyResp | null>(null);

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

  async function checkUrl() {
    if (!url.trim()) return;
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await fetch(
        `/api/merchants/identify?url=${encodeURIComponent(url.trim())}`,
        { cache: "no-store" }
      );
      const json = (await res.json()) as IdentifyResp;
      setCheckResult(json);
    } catch (e: any) {
      setCheckResult({ ok: false, error: String(e?.message ?? e) });
    } finally {
      setChecking(false);
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

      {/* Quick URL checker */}
      <div className="mt-4 rounded-2xl border p-4">
        <div className="text-sm font-medium">Quick check a product/store URL</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Paste a Shopee/Lazada link to see which connector it maps to and whether it’s ready.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="url"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="https://shopee.ph/… or https://www.lazada.com.ph/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            onClick={checkUrl}
            disabled={checking || !url.trim()}
            className="shrink-0 rounded-xl border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            {checking ? "Checking…" : "Check"}
          </button>
        </div>

        {/* Result */}
        {checkResult && (
          <div className="mt-3 rounded-xl border p-3 text-sm">
            {checkResult.ok && checkResult.match ? (
              <div>
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {checkResult.match.label}{" "}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {checkResult.match.host}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                      checkResult.match.ready
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {checkResult.match.ready ? "Ready" : "Provisioned"}
                  </span>
                </div>
                {!checkResult.match.ready && checkResult.match.missingEnv.length > 0 && (
                  <div className="mt-2 text-xs">
                    Missing env:{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5">
                      {checkResult.match.missingEnv.join(", ")}
                    </code>
                  </div>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  {checkResult.match.note || "—"}
                </div>
              </div>
            ) : checkResult.ok && !checkResult.match ? (
              <div className="text-sm">No supported merchant detected from URL.</div>
            ) : (
              <div className="text-sm text-red-600">
                {(checkResult as any).error || "Check failed."}
              </div>
            )}
          </div>
        )}
      </div>

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
