// app/dashboard/merchants/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import React from "react";
import Link from "next/link";
import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/db";
import AdminDeleteMerchantButton from "@/components/AdminDeleteMerchantButton";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import AISuggestionsClient from "./AISuggestionsClient";

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
  market?: string | null;
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
    "PH"; // default PH-first now
  const v = raw.toUpperCase();
  return v === "PH" ? "PH" : "US";
}

/** Defensive region resolver */
function resolveRegion(m: MerchantDTO): "US" | "PH" | "GLOBAL" {
  const mk = (m.market || "").toUpperCase();
  if (mk === "US" || mk === "PH" || mk === "GLOBAL") return mk as any;
  const d = (m.domainPattern || "").toLowerCase();
  if (d.endsWith(".ph") || d.endsWith(".com.ph")) return "PH";
  return "GLOBAL";
}

function userCanSeeMerchantStrict(m: MerchantDTO, userMarket: "US" | "PH") {
  if (!m.active) return false;
  const region = resolveRegion(m);
  if (region === "GLOBAL") return true;
  return region === userMarket;
}

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
        {/* Back link */}
        <div className="mb-3">
          <Link
            href="/dashboard/links"
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs text-gray-800 hover:bg-gray-50"
          >
            ← Back to Smart Links
          </Link>
        </div>

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
    <div className="p-6 space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/dashboard/links"
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs text-gray-800 hover:bg-gray-50"
        >
          ← Back to Smart Links
        </Link>
      </div>

      <DashboardPageHeader
        title="Merchants"
        subtitle={admin ? "Admin view · All regions" : `Your market: ${market} · Region-filtered`}
        rightSlot={
          <span className="hidden sm:inline-flex items-center rounded-full border px-3 py-1 text-xs text-gray-700">
            Total: {merchants.length.toLocaleString()}
          </span>
        }
      />

      {/* ✨ AI Suggestions (beta) */}
      <AISuggestionsClient />

      <section className="rounded-xl border bg-white">
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4">
          <h2 className="text-sm sm:text-base font-medium">Catalog</h2>
          {!admin && (
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] text-gray-700">
              Region: {market}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-left z-10">
              <tr className="text-left">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3 hidden sm:table-cell">Network</th>
                <th className="px-4 py-3 hidden md:table-cell">Domain</th>
                <th className="px-4 py-3 hidden md:table-cell">Cookie</th>
                <th className="px-4 py-3 hidden lg:table-cell">Payout Delay</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3 hidden lg:table-cell">Status</th>
                <th className="px-4 py-3 hidden xl:table-cell">Allowed</th>
                <th className="px-4 py-3 hidden xl:table-cell">Disallowed</th>
                <th className="px-4 py-3 hidden 2xl:table-cell">Notes</th>
                {admin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {merchants.length ? (
                merchants.map((m) => {
                  const region = resolveRegion(m);
                  return (
                    <tr key={m.id} className="border-t align-top">
                      <td className="px-4 py-3">
                        <div className="font-medium">{m.merchantName}</div>
                        <div className="sm:hidden text-xs text-gray-500 mt-0.5">
                          {m.network ?? "—"} · {m.domainPattern ?? "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <MarketBadge region={region} />
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">{m.network ?? "—"}</td>
                      <td className="px-4 py-3 hidden md:table-cell">{m.domainPattern ?? "—"}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {m.cookieWindowDays != null ? `${m.cookieWindowDays}d` : "—"}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {m.payoutDelayDays != null ? `${m.payoutDelayDays}d` : "—"}
                      </td>
                      <td className="px-4 py-3">{renderCommission(m)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs">
                          {m.status ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">{joinOrDash(m.allowedSources)}</td>
                      <td className="px-4 py-3 hidden xl:table-cell">{joinOrDash(m.disallowedSources)}</td>
                      <td className="px-4 py-3 hidden 2xl:table-cell max-w-[24rem]">
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
                })
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={admin ? 12 : 11}>
                    No merchants for your region yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {!admin && (
        <p className="mt-3 text-xs text-gray-500">
          Market filter is active. Switch markets in the header to view other regions.
        </p>
      )}
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
