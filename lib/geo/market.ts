// lib/geo/market.ts
import type { NextRequest } from "next/server";

/** Read best-effort country code from CDN/edge headers (ISO alpha-2 like "US", "PH"). */
export function getIpCountry(req: NextRequest): string | null {
  const h = req.headers;
  // Common CDNs / hosts
  const v = h.get("x-vercel-ip-country");   // Vercel
  const cf = h.get("cf-ipcountry");         // Cloudflare
  const fly = h.get("fly-client-ip-country"); // Fly.io (rare)
  const ak = h.get("x-ak-country");         // Akamai (rare)
  const any =
    (v && v !== "XX" && v !== "zz" ? v : null) ||
    (cf && cf !== "XX" ? cf : null) ||
    fly ||
    ak;
  return any ? any.toUpperCase() : null;
}

/** 24-hour expiry for temporary market overrides. */
export function isMarketOverrideValid(at?: Date | string | null): boolean {
  if (!at) return false;
  const setAt = typeof at === "string" ? new Date(at) : at;
  if (Number.isNaN(setAt.getTime())) return false;
  const now = new Date();
  const diffMs = now.getTime() - setAt.getTime();
  return diffMs >= 0 && diffMs <= 24 * 60 * 60 * 1000; // <= 24h
}

export type MinimalUser = {
  homeCountry?: string | null;     // e.g., "PH"
  currentMarket?: string | null;   // e.g., "US"
  currentMarketAt?: Date | string | null;
};

export type MinimalMerchantRule = {
  allowedCountries?: string[] | null; // if present, must include market
  blockedCountries?: string[] | null; // if present, must NOT include market
  merchantName?: string | null;
};

/** Pick the effective market for this request. Priority: currentMarket(<=24h) → ipCountry → homeCountry. */
export function resolveMarket(
  ipCountry: string | null,
  user?: MinimalUser | null
): string | null {
  const override =
    user?.currentMarket && isMarketOverrideValid(user?.currentMarketAt)
      ? user.currentMarket
      : null;
  return (override || ipCountry || user?.homeCountry || null)?.toUpperCase() || null;
}

/** Check a market against a merchant's allow/deny lists. */
export function checkGeoAllowed(
  market: string | null,
  rule: MinimalMerchantRule
): { allowed: boolean; reason?: string } {
  if (!market) return { allowed: false, reason: "unknown_market" };

  const m = market.toUpperCase();
  const blocked = (rule.blockedCountries || []).map((x) => x.toUpperCase());
  if (blocked.includes(m)) return { allowed: false, reason: "blocked_country" };

  const allowedList = rule.allowedCountries?.length
    ? (rule.allowedCountries as string[]).map((x) => x.toUpperCase())
    : null;
  if (allowedList && !allowedList.includes(m)) {
    return { allowed: false, reason: "not_in_allow_list" };
  }

  return { allowed: true };
}

/** One-shot helper to decide geo access. */
export function evaluateGeoAccess(
  req: NextRequest,
  user: MinimalUser | null,
  rule: MinimalMerchantRule
): {
  ipCountry: string | null;
  market: string | null;
  allowed: boolean;
  reason?: string;
} {
  const ipCountry = getIpCountry(req);
  const market = resolveMarket(ipCountry, user);
  const { allowed, reason } = checkGeoAllowed(market, rule);
  return { ipCountry, market, allowed, reason };
}
