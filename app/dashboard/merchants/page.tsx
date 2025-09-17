// app/dashboard/merchants/page.tsx
"use client";

import { useEffect, useState } from "react";

type Merchant = {
  id: string;
  name: string | null;
  domain: string | null;
  network: string | null;
  commission: string | null;
  status: string | boolean | null;
  updatedAt: string | null;
};

export default function MerchantsPage() {
  const [rows, setRows] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/merchant-rules/list", { cache: "no-store" });
        if (!res.ok) {
          setErr(`API error: ${res.status} ${res.statusText}`);
          setRows([]);
          return;
        }
        const json = await res.json();
        if (!json?.ok) {
          setErr("API returned ok: false");
          setRows([]);
          return;
        }
        setRows(json.merchants ?? []);
      } catch (e: any) {
        setErr(e?.message || "Network error");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="space-y-6">
      <header className="flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold">Available Merchants</h1>
        {!loading && !err && (
          <span className="text-sm text-gray-600">({rows.length} live)</span>
        )}
      </header>

      {err ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {err}. Check server logs for details.
        </div>
      ) : null}

      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-3">Name</th>
              <th className="p-3">Domain</th>
              <th className="p-3">Network</th>
              <th className="p-3">Commission</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-6 text-gray-500" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-3">{m.name ?? "—"}</td>
                  <td className="p-3">{m.domain ?? "—"}</td>
                  <td className="p-3">{m.network ?? "CJ"}</td>
                  <td className="p-3">{m.commission ?? "—"}</td>
                  <td className="p-3">
                    {typeof m.status === "boolean"
                      ? m.status
                        ? "Active"
                        : "Inactive"
                      : m.status ?? "—"}
                  </td>
                  <td className="p-3">
                    <button
                      className="text-teal-700 hover:underline"
                      onClick={() => {
                        const domain = m.domain ?? "";
                        if (!domain) return;
                        const url = domain.startsWith("http")
                          ? domain
                          : `https://${domain}`;
                        window.open(url, "_blank");
                      }}
                      disabled={!m.domain}
                      title={m.domain ? "Visit merchant site" : "No domain"}
                    >
                      Visit
                    </button>
                    {/* TODO: Add "Copy Share Link" when your user-specific share URL is ready */}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-6 text-gray-500" colSpan={6}>
                  No merchants found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
