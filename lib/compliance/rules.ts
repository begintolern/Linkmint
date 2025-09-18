import type { MerchantRule } from "@prisma/client";

/**
 * Returns true if a traffic source is allowed for the given merchant.
 * Supports simple shapes in your JSON fields:
 *  - allowedSources: { sources: ["tiktok","reddit"] } OR { tiktok: true, reddit: true }
 *  - disallowed:     { sources: ["tiktok"] }         OR { tiktok: false }
 * If both exist, disallowed wins. Default: allowed.
 */
export function isSourceAllowed(merchant: MerchantRule, source: string): boolean {
  const dis = (merchant.disallowed as unknown as any) || {};
  const allow = (merchant.allowedSources as unknown as any) || {};

  // explicit disallow
  if (Array.isArray(dis?.sources) && dis.sources.includes(source)) return false;
  if (dis && dis[source] === false) return false;

  // explicit allow
  if (Array.isArray(allow?.sources)) return allow.sources.includes(source);
  if (allow && allow[source] === true) return true;

  // default allow if not explicitly blocked
  return true;
}
