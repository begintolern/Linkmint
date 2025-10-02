export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import React from "react";
import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/db";
import AdminDeleteMerchantButton from "@/components/AdminDeleteMerchantButton";

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

  commissionType?: string | null;
  commissionRate?: string | null;
  baseCommissionBps: number | null;

  market?: string | null; // trusted source
  status?: string | null;

  notes: string | null;
};

type ListResponse = {
  ok: boolean;
  merchants: MerchantDTO[];
  error?: string;
};

function fmtPercentFromBps(bps: number | null) {
  if (bps == null) return "—";
  const pct = bps / 100;
  return `${pct.toFixed(pct % 1 === 0 ? 0 : 2)}%`;
}

function renderCommission(m: MerchantDTO) {
  const type = (m.commissionType || "").toUpperCase();
  const rate = m.commissionRate;

  if (type && rate) {
    if (type === "PERCENT") {
      const pct = Number(rate) * 100;
      if (Number.isFinite(pct)) return `${pct.toFixed(pct % 1 === 0 ? 0 : 1)}%`;
      return `${rate} (percent)`;
    }
    return `${rate} ${type}`;
  }
  return fmtPercentFromBps(m.baseCommissionBps);
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

/** Defensive region resolver:
 *  1) Trust `market` if US/PH/GLOBAL
 *  2) Fallback: if domain ends with .ph/.com.ph -> PH
 *  3) Else GLOBAL
 */
function resolveRegion(m: MerchantDTO): "US" | "PH" | "GLOBAL" {
  const mk = (m.market || "").toUpperCase();
  if (mk === "US" || mk === "PH" || mk === "GLOBAL") return mk as any;
  const d = (m.domainPattern || "").toLowerCase();
  if (d.endsWith(".ph") || d.endsWith(".com.ph")) return "PH";
  return "GLOBAL";
}

// Strict filter now uses resolved region (GLOBAL visible to all)
function userCanSeeMerchantStrict(m: MerchantDTO, userMarket: "US" | "PH") {
  if (!m.active) return false;
  const region = resolveRegion(m);
  if (region === "GLOBAL") return true;
  return region === userMarket;
}

// Admin detection (same as used in other pages)
async function isAdmin(store: ReturnType<typeof cookies>): Promise<boolean> {
  const cookieRole = (store.get("role")?.value ?? "").toLowerCase();
  if (cookieRole === "admin") return true;

  const email = store.get("email")?.value || "";
  const uid =
    store.get("uid")?.value ||
    store.get("userId")?.value ||
    "";

  const allowList = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (email && allowList.includes(email.toLowerCase())) return true;

  try {
    if (uid) {
      const u = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
      if (u?.role && String(u.role).toLowerCase() === "admin") return true;
    }
    if (email) {
      const u = await prisma.user.findUnique({ where: { email }, select: { role: true } });
      if (u?.role && String(u.role).toLowerCase() === "admin") return true;
    }
  } catch { /* ignore */ }

  return false;
}

export default async function MerchantsPage() {
  const baseUrl = getBaseUrl();
  const store = cookies();
  const market = readMarketFromCookies(store);
  const admin = await isAdmin(store);

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
  const merchants = admin ? all : all.filter((m) => userCanSeeMerchantStrict(m, market));

  return (
    <div className="p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Merchants</h1>
        <div className="text-sm text-gray-500">
          {admin
            ? `Admin view · All regions · Total: ${merchants.length.toLocaleString()}`
            : `Your market: ${market} · Region-filtered · Total: ${merchants.length.toLocaleString()}`}
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
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">Cookie</th>
              <th className="px-4 py-3">Payout Delay</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Allowed</th>
              <th className="px-4 py-3">Disallowed</th>
              <th className="px-4 py-3">Notes</th>
              {admin && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {merchants.map((m) => {
              const region = resolveRegion(m);
              return (
                <tr key={m.id} className="border-t align-top">
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
                  <td className="px-4 py-3">
                    <MarketBadge region={region} />
                  </td>
                  <td className="px-4 py-3">
                    {m.cookieWindowDays != null ? `${m.cookieWindowDays}d` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {m.payoutDelayDays != null ? `${m.payoutDelayDays}d` : "—"}
                  </td>
                  <td className="px-4 py-3">{renderCommission(m)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs">
                      {m.status ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{joinOrDash(m.allowedSources)}</td>
                  <td className="px-4 py-3">{joinOrDash(m.disallowedSources)}</td>
                  <td className="px-4 py-3 max-w-[24rem]">
                    <div className="truncate" title={m.notes ?? ""}>
                      {m.notes ?? "—"}
                    </div>
                  </td>

                  {admin && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <AdminDeleteMerchantButton id={m.id} name={m.merchantName} />
                    </td>
                  )}
                </tr>
              );
            })}

            {merchants.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={admin ? 13 : 12}>
                  No merchants for your region yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MarketBadge({ region }: { region: "US" | "PH" | "GLOBAL" }) {
  const tone =
    region === "PH"
      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
      : region === "US"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${tone}`}>
      {region}
    </span>
  );
}
