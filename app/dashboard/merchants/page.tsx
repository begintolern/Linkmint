// app/dashboard/merchants/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import Link from "next/link";

type MerchantRule = {
  id: string;
  active: boolean;
  merchantName: string;
  network: string | null;
  domainPattern: string | null;
  allowedSources: string[] | null;
  disallowed: string[] | null;
  cookieWindowDays: number | null;
  payoutDelayDays: number | null;
  commissionType: "PERCENT" | "FLAT" | null;
  commissionRate: string | null; // stored as decimal string (e.g., "0.12")
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
};

async function fetchMerchants(q?: string) {
  const url = `/api/merchant-rules/list${q ? `?q=${encodeURIComponent(q)}` : ""}`;
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to load merchant rules");
  }
  const data = await res.json();
  return data.rules as MerchantRule[];
}

function pct(rate: string | null) {
  if (!rate) return "—";
  const n = Number(rate);
  if (Number.isNaN(n)) return rate;
  return `${(n * 100).toFixed(n >= 0.1 ? 0 : 2)}%`;
}

export default async function MerchantsPage() {
  const rules = await fetchMerchants();

  const active = rules.filter((r) => r.active);
  const pending = rules.filter((r) => !r.active);

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Merchants</h1>
        <Link
          href="/admin/merchant-rules"
          className="px-3 py-2 rounded-xl border hover:bg-gray-50"
        >
          Admin: Manage Rules
        </Link>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">Active</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {active.length === 0 && (
            <div className="text-sm text-gray-500">No active merchants yet.</div>
          )}
          {active.map((m) => (
            <article
              key={m.id}
              className="rounded-2xl border p-4 shadow-sm"
              title={m.notes ?? ""}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{m.merchantName}</div>
                <div className="text-sm text-gray-500">
                  {m.domainPattern ?? "—"}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-700">
                <div>
                  Commission:{" "}
                  <span className="font-medium">
                    {m.commissionType ?? "—"}{" "}
                    {m.commissionType === "PERCENT"
                      ? pct(m.commissionRate)
                      : m.commissionRate ?? ""}
                  </span>
                </div>
                <div>
                  Cookie:{" "}
                  <span className="font-medium">
                    {m.cookieWindowDays ?? "—"}
                  </span>{" "}
                  days
                </div>
              </div>
              {m.allowedSources?.length ? (
                <div className="mt-2 text-xs text-gray-600">
                  Allowed: {m.allowedSources.join(", ")}
                </div>
              ) : null}
              {m.disallowed?.length ? (
                <div className="mt-1 text-xs text-red-600">
                  Disallowed: {m.disallowed.join(", ")}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Pending</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pending.length === 0 && (
            <div className="text-sm text-gray-500">No pending merchants.</div>
          )}
          {pending.map((m) => (
            <article
              key={m.id}
              className="rounded-2xl border p-4 shadow-sm opacity-60"
              title={m.notes ?? ""}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{m.merchantName}</div>
                <div className="text-sm text-gray-500">
                  {m.domainPattern ?? "—"}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-700">
                <div>
                  Commission:{" "}
                  <span className="font-medium">
                    {m.commissionType ?? "—"}{" "}
                    {m.commissionType === "PERCENT"
                      ? pct(m.commissionRate)
                      : m.commissionRate ?? ""}
                  </span>
                </div>
                <div>
                  Cookie:{" "}
                  <span className="font-medium">
                    {m.cookieWindowDays ?? "—"}
                  </span>{" "}
                  days
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
