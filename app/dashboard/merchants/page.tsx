export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { headers } from "next/headers";

type MerchantRuleDTO = {
  id: string;
  merchantName: string;
  active: boolean;
  network: string | null;
  domainPattern: string | null;
  allowedSources: string[] | null;
  disallowedSources: string[] | null;
  defaultCommissionRate: number | null;
  commissionType: string | null;
  cookieWindowDays: number | null;
  payoutDelayDays: number | null;
  isGreyListed?: boolean | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

function getBaseUrl() {
  // Prefer runtime headers (works on Railway/Vercel behind proxies)
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;

  // Fallback to envs if headers are unavailable
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL ??
    process.env.RAILWAY_PUBLIC_DOMAIN;
  if (envUrl) {
    // Ensure protocol
    return envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
  }
  // Last resort (won't work in prod if host is unknown)
  return "http://localhost:3000";
}

async function fetchMerchants(activeOnly = false): Promise<MerchantRuleDTO[]> {
  const base = getBaseUrl();
  const url = `${base}/api/merchant-rules/list?activeOnly=${activeOnly}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load merchants: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (!data?.ok) throw new Error(data?.message ?? "API returned not ok");
  return (data.merchants ?? []) as MerchantRuleDTO[];
}

function fmtList(list: string[] | null | undefined) {
  if (!list || list.length === 0) return "—";
  return list.join(", ");
}

function fmtCommission(m: MerchantRuleDTO) {
  const rate = m.defaultCommissionRate;
  if (rate != null && !Number.isNaN(rate)) {
    if ((m.commissionType ?? "").toUpperCase() === "PERCENT") return `${rate}%`;
    return `${rate}`;
  }
  return "TBD";
}

export default async function Page() {
  let merchants: MerchantRuleDTO[] = [];
  try {
    merchants = await fetchMerchants(false); // show all
  } catch (e: any) {
    // Render a simple error block on the page instead of crashing the route
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-2">Merchant Rules</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Failed to load merchants: {e?.message ?? "Unknown error"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Merchant Rules</h1>
        <span className="text-sm opacity-70">Total: {merchants.length}</span>
      </div>

      {merchants.length === 0 ? (
        <div className="text-sm opacity-70">No merchants found.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-4 py-3">Merchant</th>
                <th className="px-4 py-3">Network</th>
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3">Cookie (days)</th>
                <th className="px-4 py-3">Allowed Sources</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {merchants.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">{m.merchantName}</div>
                    {m.notes ? (
                      <div className="text-xs opacity-70">{m.notes}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{m.network ?? "—"}</td>
                  <td className="px-4 py-3">{m.domainPattern ?? "—"}</td>
                  <td className="px-4 py-3">{fmtCommission(m)}</td>
                  <td className="px-4 py-3">
                    {m.cookieWindowDays != null ? m.cookieWindowDays : "—"}
                  </td>
                  <td className="px-4 py-3">{fmtList(m.allowedSources)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                        m.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {m.active ? "Active" : "Inactive"}
                    </span>
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
