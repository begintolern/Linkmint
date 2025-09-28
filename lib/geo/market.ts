// lib/geo/market.ts
export type GeoDecision = {
  allowed: boolean;
  reason?: string | null;  // market_not_allowed | ip_not_allowed | blocked_country | not_in_allow_list
  market: string | null;   // sharer account market used
  ipCountry: string | null;
};

const LOCK_MARKET = (process.env.LOCK_MARKET || "").toLowerCase() === "true";

export function evaluateGeoAccess(
  req: Request,
  user: { countryCode?: string | null } | null,
  rule: { allowedCountries?: string[] | null; blockedCountries?: string[] | null }
): GeoDecision {
  const headers = (req as any).headers ?? new Headers();

  // Country from edge headers (viewer)
  const ipCountryRaw =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    headers.get("x-country") ||
    null;

  const ipCountry = ipCountryRaw ? ipCountryRaw.toUpperCase() : null;

  // Resolve sharer market
  let market: string | null = null;
  if (LOCK_MARKET) {
    market = (user?.countryCode || null)?.toUpperCase() || null;
  } else {
    const cookieHeader = headers.get("cookie") || "";
    const cookieMarket = getCookie(cookieHeader, "lm_market");
    market =
      (cookieMarket || user?.countryCode || ipCountry || null)?.toUpperCase() || null;
  }

  const allowList = (rule?.allowedCountries ?? []).map((c) => c.toUpperCase());
  const blockList = (rule?.blockedCountries ?? []).map((c) => c.toUpperCase());

  // If no allowList configured, treat as open
  const hasAllow = allowList.length > 0;

  const marketAllowed = hasAllow ? !!(market && allowList.includes(market)) : true;
  const ipAllowed     = hasAllow ? !!(ipCountry && allowList.includes(ipCountry)) : true;

  const marketBlocked = !!(market && blockList.includes(market));
  const ipBlocked     = !!(ipCountry && blockList.includes(ipCountry));

  let allowed = marketAllowed && ipAllowed && !marketBlocked && !ipBlocked;

  let reason: string | null = null;
  if (!allowed) {
    if (marketBlocked || ipBlocked) {
      reason = "blocked_country";
    } else if (!marketAllowed) {
      reason = hasAllow ? "market_not_allowed" : "not_in_allow_list";
    } else if (!ipAllowed) {
      reason = hasAllow ? "ip_not_allowed" : "not_in_allow_list";
    } else {
      reason = "not_in_allow_list";
    }
  }

  return {
    allowed,
    reason,
    market,
    ipCountry,
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
