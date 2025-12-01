// lib/affiliates/involveAsia.ts

/**
 * Build an Involve Asia deeplink using merchant-specific bases where needed.
 *
 * Currently:
 * - Havaianas PH uses its own base: https://invl.me/cln3mjj
 * - Other merchants can fall back to INVOLVEASIA_BASE_URL (if set)
 * - If no base is available, we just return the original URL with lm_subid + utm_source
 */

const DEFAULT_BASE = process.env.INVOLVEASIA_BASE_URL || "";
const DEEPLINK_PARAM = process.env.INVOLVEASIA_DEEPLINK_PARAM || "url";
const SUBID_PARAM = process.env.INVOLVEASIA_SUBID_PARAM || "sub_id";

/**
 * Returns an IA deeplink like:
 *   https://invl.me/XXXXXXX?url=<encoded product>&sub_id=<smartlinkId>&lm_subid=<smartlinkId>&utm_source=linkmint
 *
 * If no suitable base exists, we fall back to attaching tracking params directly
 * to the original product URL (non-IA tracking, same as your old behavior).
 */
export function buildInvolveAsiaUrl(
  originalUrl: string,
  smartlinkId: string
): string {
  let base = DEFAULT_BASE;

  try {
    const host = new URL(originalUrl).hostname.toLowerCase();

    // 🔹 Havaianas PH – specific IA base you gave:
    // https://invl.me/cln3mjj?url=...
    if (host.includes("havaianas.ph")) {
      base = "https://invl.me/cln3mjj";
    }

    // You can add more per-merchant bases here later, e.g.:
    // if (host.includes("charleskeith.com")) {
    //   base = "https://invl.me/your-charles-keith-base";
    // }
  } catch {
    // If URL parsing fails, we’ll just fall back below
  }

  // If we still don't have any IA base, fall back to direct product URL with lm_subid
  if (!base) {
    try {
      const u = new URL(
        /^https?:\/\//i.test(originalUrl)
          ? originalUrl
          : `https://${originalUrl}`
      );
      u.searchParams.set("lm_subid", smartlinkId);
      u.searchParams.set("utm_source", "linkmint");
      return u.toString();
    } catch {
      // As last resort, return whatever we got
      return originalUrl;
    }
  }

  // Normal IA deeplink build
  const u = new URL(base);
  u.searchParams.set(DEEPLINK_PARAM, originalUrl);
  u.searchParams.set(SUBID_PARAM, smartlinkId);
  u.searchParams.set("lm_subid", smartlinkId);
  u.searchParams.set("utm_source", "linkmint");

  return u.toString();
}
