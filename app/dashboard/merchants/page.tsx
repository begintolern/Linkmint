// app/dashboard/merchants/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import React from "react";
import { headers, cookies } from "next/headers";

type MerchantDTO = {
  id: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  merchantName: string;
  active: boolean;
  network: string | null;
  domainPattern: string | null;
  allowedSources: string[] | null;
  disallowedSources: string[] | null;
  cookieWindowDays: number | null;
  payoutDelayDays: number | null;
  baseCommissionBps: number | null;
  notes: string | null; // <-- we will parse mkt:US / mkt:PH here
};

type ListResponse = {
  ok: boolean;
  merchants: MerchantDTO[];
  error?: string;
};

function fmtPercentFromBps(bps: number | null) {
  if (bps == null) return "—";
  const pct = bps / 100; // 100 bps = 1%
  return `${pct.toFixed(pct % 1 === 0 ? 0 : 2)}%`;
}

function joinOrDash(arr: string[] | null) {
  if (!arr || arr.length === 0) return "—";
  return arr.join(", ");
}

function getBaseUrl() {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host") ?? "linkmint.co";
  return `${proto}://${host}`;
}

function readMarketFromCookies(store: ReturnType<typeof cookies>) {
  const raw =
    store.get("market")?.value ||
    store.get("lm_market")?.value ||
    store.get("mkt")?.value ||
    "US";
  const v = raw.toUpperCase();
  return v === "PH" ? "PH" : "US";
}

/** Extract explicit market tag from notes, e.g.:
 *   notes: "mkt:US; geo:allow=US; ..."
 *   notes: "mkt:PH ..."
 * Returns "US" | "PH" | null if not tagged.
 */
function parseMarketFromNotes(notes?: string | null): "US" | "PH" | null {
  if (!notes) return null;
  const m = notes.match(/mkt\s*:\s*(US|PH)\b/i);
  if (!m) return null;
  return m[1].toUpperCase() as "US" | "PH";
}

// Strict user filter:
// - must be active
// - must have explicit mkt: tag that matches user's market
function userCanSeeMerchantStrict(m: MerchantDTO, userMarket: "US" | "PH") {
  if (!m.active) return false;
  const tag = parseMarketFromNotes(m.notes ?? undefined);
  if (!tag) return false;            // STRICT: hide if merchant not tagged with mkt:
  return tag === userMarket;
}

export default async function MerchantsPage() {
  const baseUrl = getBaseUrl();

  // Read role/market from cookies
  const store = cookies();
  const role = (store.get("role")?.value || "user").toLowerCase();
  const market = readMarketFromCookies(store);

  let data: ListResponse | null = null;

  try {
    const res = await fetch(`${baseUrl}/api/merchant-rules/list`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    data = (await res.json()) as ListResponse;
  } catch {
    data = { ok: false, merchants: [], error: "Failed to fetch." };
  }

  if (!data?.ok) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-2">Merchants</h1>
        <p className="text-sm text-red-600">
          Failed to load merchant rules{data?.error ? ` — ${data.error}` : ""}.
        </p>
      </div>
    );
  }

  const all = data.merchants;
  const merchants =
    role === "admin" ? all : all.filter((m) => userCanSeeMerchantStrict(m, market));

  return (
    <div className="p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Merchants</h1>
        <div className="text-sm text-gray-500">
          {role === "admin"
            ? `Admin view · US + PH · Total: ${merchants.length.toLocaleString()}`
            : `Your market: ${market} · Strict region filter (mkt:${market}) · Total: ${merchants.length.toLocaleString()}`}
        </div>
      </div>

      <div className="overflow-x-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Network</th>
              <th className="px-4 py-3">Domain</th>
              <th className="px-4 py-3">Market (from notes)</th>
              <th className="px-4 py-3">Allowed</th>
              <th className="px-4 py-3">Disallowed</th>
              <th className="px-4 py-3">Cookie</th>
              <th className="px-4 py-3">Payout Delay</th>
              <th className="px-4 py-3">Base %</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((m) => {
              const tag = parseMarketFromNotes(m.notes ?? undefined) || "—";

              return (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{m.merchantName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs " +
                        (m.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600")
                      }
                    >
                      {m.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{m.network ?? "—"}</td>
                  <td className="px-4 py-3">{m.domainPattern ?? "—"}</td>
                  <td className="px-4 py-3">{tag}</td>
                  <td className="px-4 py-3">{joinOrDash(m.allowedSources)}</td>
                  <td className="px-4 py-3">{joinOrDash(m.disallowedSources)}</td>
                  <td className="px-4 py-3">
                    {m.cookieWindowDays != null ? `${m.cookieWindowDays}d` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {m.payoutDelayDays != null ? `${m.payoutDelayDays}d` : "—"}
                  </td>
                  <td className="px-4 py-3">{fmtPercentFromBps(m.baseCommissionBps)}</td>
                  <td className="px-4 py-3 max-w-[24rem]">
                    <div className="truncate" title={m.notes ?? ""}>
                      {m.notes ?? "—"}
                    </div>
                  </td>
                </tr>
              );
            })}

            {merchants.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={11}>
                  No merchants for your region yet. (Ask admin to add <code>mkt:{market}</code> in Notes.)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {role !== "admin" && (
        <p className="mt-3 text-xs text-gray-500">
          Strict region filter is enabled for users. To list a merchant, add <code>mkt:US</code> or{" "}
          <code>mkt:PH</code> in the merchant’s Notes.
        </p>
      )}
    </div>
  );
}
