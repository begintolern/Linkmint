// app/dashboard/merchants/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import React from "react";
import { headers } from "next/headers";

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
  notes: string | null;
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

export default async function MerchantsPage() {
  let data: ListResponse | null = null;
  const baseUrl = getBaseUrl();

  try {
    const res = await fetch(`${baseUrl}/api/merchant-rules/list`, {
      cache: "no-store",
      // Forward cookies if needed later for authed APIs:
      headers: { accept: "application/json" },
    });
    data = (await res.json()) as ListResponse;
  } catch (e) {
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

  const merchants = data.merchants;

  return (
    <div className="p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Merchants</h1>
        <div className="text-sm text-gray-500">
          Total: {merchants.length.toLocaleString()}
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
              <th className="px-4 py-3">Allowed</th>
              <th className="px-4 py-3">Disallowed</th>
              <th className="px-4 py-3">Cookie</th>
              <th className="px-4 py-3">Payout Delay</th>
              <th className="px-4 py-3">Base %</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="px-4 py-3 font-medium">{m.merchantName}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs " +
                      (m.active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600")
                    }
                  >
                    {m.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">{m.network ?? "—"}</td>
                <td className="px-4 py-3">{m.domainPattern ?? "—"}</td>
                <td className="px-4 py-3">{joinOrDash(m.allowedSources)}</td>
                <td className="px-4 py-3">{joinOrDash(m.disallowedSources)}</td>
                <td className="px-4 py-3">
                  {m.cookieWindowDays != null ? `${m.cookieWindowDays}d` : "—"}
                </td>
                <td className="px-4 py-3">
                  {m.payoutDelayDays != null ? `${m.payoutDelayDays}d` : "—"}
                </td>
                <td className="px-4 py-3">
                  {fmtPercentFromBps(m.baseCommissionBps)}
                </td>
                <td className="px-4 py-3 max-w-[24rem]">
                  <div className="truncate" title={m.notes ?? ""}>
                    {m.notes ?? "—"}
                  </div>
                </td>
              </tr>
            ))}

            {merchants.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={10}>
                  No merchants yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
