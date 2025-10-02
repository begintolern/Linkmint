// app/dashboard/merchants/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import React from "react";
import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/db";

type MerchantDTO = {
  id: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  merchantName: string;
  active: boolean;
  network: string | null;
  domainPattern: string | null;

  // Sources (may be null/missing depending on schema)
  allowedSources: string[] | null;
  disallowedSources: string[] | null;

  // Windows
  cookieWindowDays: number | null;
  payoutDelayDays: number | null;

  // Commission (new preferred fields)
  commissionType?: string | null; // e.g., "PERCENT"
  commissionRate?: string | null; // e.g., "0.06"

  // Legacy/fallback
  baseCommissionBps: number | null;

  // Region / status (added to API)
  market?: string | null; // e.g., "PH", "US", "GLOBAL"
  status?: string | null; // e.g., "PENDING", "ACTIVE"

  // Notes (may include mkt:PH tag)
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
  // Prefer commissionType/commissionRate when provided
  const type = (m.commissionType || "").toUpperCase();
  const rate = m.commissionRate;

  if (type && rate) {
    if (type === "PERCENT") {
      const pct = Number(rate) * 100;
      if (Number.isFinite(pct)) return `${pct.toFixed(pct % 1 === 0 ? 0 : 1)}%`;
      return `${rate} (percent)`;
    }
    // Extend here for FLAT, TIERED, etc., if you add them later
    return `${rate} ${type}`;
  }

  // Fallback to legacy baseCommissionBps
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

/** notes: "mkt:US" or "mkt:PH" */
function parseMarketFromNotes(notes?: string | null): "US" | "PH" | null {
  if (!notes) return null;
  const m = notes.match(/mkt\s*:\s*(US|PH)\b/i);
  return m ? (m[1].toUpperCase() as "US" | "PH") : null;
}

function effectiveMarket(m: MerchantDTO): "US" | "PH" | "GLOBAL" | "—" {
  const mk = (m.market || "").toUpperCase();
  if (mk === "US" || mk === "PH" || mk === "GLOBAL") return mk as any;
  const fromNotes = parseMarketFromNotes(m.notes ?? undefined);
  return fromNotes || "—";
}

// Strict user filter: active + region matches user market
function userCanSeeMerchantStrict(m: MerchantDTO, userMarket: "US" | "PH") {
  if (!m.active) return false;
  const mk = effectiveMarket(m);
  // If market is GLOBAL, allow both; otherwise must match
  if (mk === "GLOBAL") return true;
  if (mk === "US" || mk === "PH") return mk === userMarket;
  // If unknown (—), hide from non-admin users
  return false;
}

// ROBUST admin detection: DB OR cookie OR allow-list
async function isAdmin(store: ReturnType<typeof cookies>): Promise<boolean> {
  const cookieRole = (store.get("role")?.value ?? "").toLowerCase();
  if (cookieRole === "admin") return true;

  const email = store.get("email")?.value || "";
  const uid =
    store.get("uid")?.value ||
    store.get("userId")?.value ||
    "";

  // Env allow-list fallback (comma-separated emails)
  const allowList = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (email && allowList.includes(email.toLowerCase())) return true;

  // DB check by id or email
  try {
    if (uid) {
      const u = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
      if (u?.role && String(u.role).toLowerCase() === "admin") return true;
    }
    if (email) {
      const u = await prisma.user.findUnique({ where: { email }, select: { role: true } });
      if (u?.role && String(u.role).toLowerCase() === "admin") return true;
    }
  } catch {
    // ignore, fall through
  }

  return false;
}

export default async function MerchantsPage() {
  const baseUrl = getBaseUrl();
  const store = cookies();
  const market = readMarketFromCookies(store);
  const admin = await isAdmin(store); // robust admin flag

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
            </tr>
          </thead>
          <tbody>
            {merchants.map((m) => {
              const region = effectiveMarket(m);
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
                </tr>
              );
            })}

            {merchants.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={12}>
                  No merchants for your region yet.
                  {admin ? null : (
                    <> (Ask admin to set <code>market</code> or add <code>mkt:{market}</code> in Notes.)</>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!admin && (
        <p className="mt-3 text-xs text-gray-500">
          Region logic: if a merchant has <code>market</code> set to <code>GLOBAL</code>, it’s visible to all users.
          If <code>market</code> is missing, we look for <code>mkt:US</code> or <code>mkt:PH</code> in Notes.
        </p>
      )}
    </div>
  );
}

function MarketBadge({ region }: { region: "US" | "PH" | "GLOBAL" | "—" }) {
  const tone =
    region === "PH"
      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
      : region === "US"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : region === "GLOBAL"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${tone}`}>
      {region}
    </span>
  );
}
