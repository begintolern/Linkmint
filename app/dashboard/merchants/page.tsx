export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

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

async function fetchMerchants(activeOnly = false): Promise<MerchantRuleDTO[]> {
  // Relative URL works in App Router server components
  const res = await fetch(`/api/merchant-rules/list?activeOnly=${activeOnly}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to load merchants: ${res.status}`);
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
    // Show % for PERCENT, otherwise just the numeric value
    if ((m.commissionType ?? "").toUpperCase() === "PERCENT") {
      return `${rate}%`;
    }
    return `${rate}`;
  }
  // Fallback for schemas that only store commissionRate under a different field (defensive)
  // This keeps UI from looking empty while we normalize DB over time.
  return "TBD";
}

export default async function Page() {
  const merchants = await fetchMerchants(false); // show all (active + inactive)

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Merchant Rules</h1>
        <span className="text-sm opacity-70">
          Total: {merchants.length}
        </span>
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
