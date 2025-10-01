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
  allowedSources: string[] | null;
  disallowedSources: string[] | null;
  cookieWindowDays: number | null;
  payoutDelayDays: number | null;
  baseCommissionBps: number | null;
  notes: string | null; // parse mkt:US/PH here
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

// Strict user filter: active + mkt tag matches user market
function userCanSeeMerchantStrict(m: MerchantDTO, userMarket: "US" | "PH") {
  if (!m.active) return false;
  const tag = parseMarketFromNotes(m.notes ?? undefined);
  if (!tag) return false;
  return tag === userMarket;
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
  const admin = await isAdmin(store); // <-- robust admin flag

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
                    <span className={"inline-flex items-center rounded-full px-2 py-0.5 text-xs " + (m.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600")}>
                      {m.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{m.network ?? "—"}</td>
                  <td className="px-4 py-3">{m.domainPattern ?? "—"}</td>
                  <td className="px-4 py-3">{tag}</td>
                  <td className="px-4 py-3">{joinOrDash(m.allowedSources)}</td>
                  <td className="px-4 py-3">{joinOrDash(m.disallowedSources)}</td>
                  <td className="px-4 py-3">{m.cookieWindowDays != null ? `${m.cookieWindowDays}d` : "—"}</td>
                  <td className="px-4 py-3">{m.payoutDelayDays != null ? `${m.payoutDelayDays}d` : "—"}</td>
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

      {!admin && (
        <p className="mt-3 text-xs text-gray-500">
          Strict region filter is enabled for users. To list a merchant, add <code>mkt:US</code> or <code>mkt:PH</code> in the merchant’s Notes.
        </p>
      )}
    </div>
  );
}
