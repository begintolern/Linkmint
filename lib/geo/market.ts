// lib/geo/market.ts
export type GeoDecision = {
  allowed: boolean;
  reason?: string | null;
  market: string | null;      // resolved market we used
  ipCountry: string | null;   // from headers, if present
};

const LOCK_MARKET = (process.env.LOCK_MARKET || "").toLowerCase() === "true";

export function evaluateGeoAccess(
  req: Request,
  user: { countryCode?: string | null } | null,
  rule: { allowedCountries?: string[] | null; blockedCountries?: string[] | null }
): GeoDecision {
  const headers = (req as any).headers ?? new Headers();
  // Vercel / Cloudflare country headers
  const ipCountry =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    headers.get("x-country") ||
    null;

  // Resolve market:
  // - if LOCK_MARKET: use user.countryCode only
  // - else: fall back to cookie override, then user.countryCode, then ipCountry
  let market: string | null = null;

  if (LOCK_MARKET) {
    market = (user?.countryCode || null)?.toUpperCase() || null;
  } else {
    const cookieHeader = headers.get("cookie") || "";
    const cookieMarket = getCookie(cookieHeader, "lm_market");
    market =
      (cookieMarket || user?.countryCode || ipCountry || null)?.toUpperCase() || null;
  }

  const allow = (rule?.allowedCountries && rule.allowedCountries.length > 0)
    ? rule.allowedCountries.map((c) => c.toUpperCase()).includes(market || "")
    : true; // if no allowlist, treat as open

  const block = (rule?.blockedCountries && rule.blockedCountries.length > 0)
    ? rule.blockedCountries.map((c) => c.toUpperCase()).includes(market || "")
    : false;

  const allowed = allow && !block;

  return {
    allowed,
    reason: allowed ? null : (!allow ? "not_in_allow_list" : "blocked_country"),
    market,
    ipCountry: (ipCountry || null)?.toUpperCase() || null,
  };
}

// tiny cookie reader (no deps)
function getCookie(cookieHeader: string, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(/; */);
  const target = name + "=";
  for (const p of parts) {
    if (p.startsWith(target)) return decodeURIComponent(p.slice(target.length));
  }
  return null;
}
