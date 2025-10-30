// lib/config/market.ts

export type Market = "PH" | "US" | "GLOBAL";

/**
 * Reads the active market from environment.
 * For PH-only launch, set LINKMINT_ACTIVE_MARKET=PH in .env
 */
export const ACTIVE_MARKET: Market = (process.env.LINKMINT_ACTIVE_MARKET || "PH")
  .toUpperCase() as Market;

/** Convenience boolean for PH-only mode */
export const IS_MARKET_PH = ACTIVE_MARKET === "PH";

/** Normalize any free-text region to our uppercase two-letter code. */
export function normalizeRegion(input?: string | null): Market {
  const v = (input || "").trim().toUpperCase();
  if (v === "PH" || v === "US" || v === "GLOBAL") return v;
  // Default to PH during PH-only launch
  return "PH";
}

/**
 * Decide whether a request may see "all regions".
 * In PH-only launch, only admins can ever request all regions.
 */
export function canViewAllRegions(
  viewerRole: "admin" | "user",
  wantsAll: boolean
): boolean {
  if (!wantsAll) return false;
  if (viewerRole !== "admin") return false;
  // If you later launch US/GLOBAL, you can relax this rule here.
  return true;
}

/**
 * Returns the effective region for a non-admin viewer in PH-only mode.
 * If a caller passes a different region, we force it back to "PH".
 */
export function effectiveUserRegion(
  viewerRole: "admin" | "user",
  requestedRegion?: string | null
): Market {
  if (viewerRole === "admin") {
    // Admins can explicitly filter by ?region in routes.
    return normalizeRegion(requestedRegion);
  }
  // Non-admins in PH launch are locked to PH.
  return "PH";
}
