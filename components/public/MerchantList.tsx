"use client";

import { useEffect, useState } from "react";

type Merchant = {
  id: string;
  merchantName: string;
  network: string | null;
  domainPattern: string | null;
  commissionType: string | null;
  commissionRate: string | null; // normalized to string by the API
  status: "PENDING" | "ACTIVE" | "REJECTED";
  active: boolean;
  notes: string | null;
};

export default function MerchantList() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setLoading(true);
    setErr(null);
    const url = showAll ? "/api/public/merchants?all=true" : "/api/public/merchants";
    fetch(url, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((json) => setMerchants(json.merchants as Merchant[]))
      .catch((e: any) => setErr(e.message ?? "Failed to load merchants"))
      .finally(() => setLoading(false));
  }, [showAll]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Merchants</h2>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
          />
          Show all (include pending/rejected)
        </label>
      </div>

      {loading && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="h-5 w-40 animate-pulse mb-2" />
          <div className="h-4 w-72 animate-pulse" />
        </div>
      )}

      {err && (
        <div className="rounded-2xl border bg-red-50 text-red-700 p-4">
          Error: {err}
        </div>
      )}

      {!loading && !err && merchants.length === 0 && (
        <div className="text-sm text-gray-500">No merchants yet.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {merchants.map((m) => {
          const isActive = m.status === "ACTIVE" && m.active;
          const statusTheme =
            m.status === "ACTIVE"
              ? "bg-green-50 text-green-700 border-green-300"
              : m.status === "PENDING"
              ? "bg-yellow-50 text-yellow-700 border-yellow-300"
              : "bg-red-50 text-red-700 border-red-300";

          return (
            <div
              key={m.id}
              className={`rounded-2xl border p-4 bg-white shadow-sm ${
                !isActive ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-base font-semibold truncate">
                    {m.merchantName}{" "}
                    <span className="text-xs text-gray-500">
                      ({m.network ?? "—"})
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Domain: <span className="font-mono">{m.domainPattern ?? "—"}</span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${statusTheme}`}>
                  {m.status}
                </span>
              </div>

              <div className="mt-3 text-sm text-gray-700">
                Commission:{" "}
                <span className="font-mono">
                  {m.commissionType ?? "—"} @ {m.commissionRate ?? "—"}
                </span>
              </div>

              {m.notes && (
                <div className="mt-2 text-xs text-gray-600 line-clamp-2">{m.notes}</div>
              )}

              <div className="mt-4 flex items-center gap-2">
                <a
                  href={`/dashboard/links?merchant=${encodeURIComponent(m.merchantName)}`}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition ${
                    isActive
                      ? "bg-black text-white hover:bg-gray-800"
                      : "bg-gray-100 text-gray-500 cursor-not-allowed"
                  }`}
                  aria-disabled={!isActive}
                  onClick={(e) => {
                    if (!isActive) e.preventDefault();
                  }}
                >
                  {isActive ? "Visit merchant" : "Pending approval"}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
