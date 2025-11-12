// lib/affiliates/deeplink.ts

/**
 * Build a network-wrapped affiliate URL that preserves the original product URL
 * so users land on the exact item page (not the store homepage).
 *
 * Both helpers read env vars so we can change partners without touching code.
 *
 * Shopee env (example):
 *  - SHOPEE_BASE_URL=https://shopeeaffiliateshort.com/shorten   (example)
 *  - SHOPEE_DEEPLINK_PARAM=url
 *  - SHOPEE_SUBID_PARAM=subid
 *  - SHOPEE_AFF_ID_PARAM=an_id
 *  - SHOPEE_AFF_ID_VALUE=13266010000
 *
 * Lazada (Involve Asia / Atid / etc.) env (example):
 *  - LAZADA_BASE_URL=https://invol.co/aff_m?offer_id=...
 *  - LAZADA_DEEPLINK_PARAM=url
 *  - LAZADA_SUBID_PARAM=aff_sub
 *  - LAZADA_AFF_ID_PARAM=an_id
 *  - LAZADA_AFF_ID_VALUE=17449020
 */

function safeAppendTracking(u: URL, subid: string) {
  if (!u.searchParams.has("lm_subid")) u.searchParams.set("lm_subid", subid);
  if (!u.searchParams.has("utm_source")) u.searchParams.set("utm_source", "linkmint");
}

export function buildShopeeUrl(productUrl: string, subid: string): string | null {
  const base = (process.env.SHOPEE_BASE_URL || "").trim();
  if (!base) return null;

  const deeplinkParam = (process.env.SHOPEE_DEEPLINK_PARAM || "url").trim();
  const subidParam = (process.env.SHOPEE_SUBID_PARAM || "subid").trim();
  const affIdParam = (process.env.SHOPEE_AFF_ID_PARAM || "").trim();
  const affIdValue = (process.env.SHOPEE_AFF_ID_VALUE || "").trim();

  try {
    const out = new URL(base);
    out.searchParams.set(deeplinkParam, productUrl);
    out.searchParams.set(subidParam, subid);
    if (affIdParam && affIdValue) out.searchParams.set(affIdParam, affIdValue);
    safeAppendTracking(out, subid);
    return out.toString();
  } catch {
    return null;
  }
}

export function buildLazadaUrl(productUrl: string, subid: string): string | null {
  const base = (process.env.LAZADA_BASE_URL || process.env.INVOLVEASIA_BASE_URL || "").trim();
  if (!base) return null;

  const deeplinkParam =
    (process.env.LAZADA_DEEPLINK_PARAM || process.env.INVOLVEASIA_DEEPLINK_PARAM || "url").trim();
  const subidParam =
    (process.env.LAZADA_SUBID_PARAM || process.env.INVOLVEASIA_SUBID_PARAM || "aff_sub").trim();
  const affIdParam =
    (process.env.LAZADA_AFF_ID_PARAM || process.env.INVOLVEASIA_AFF_ID_PARAM || "").trim();
  const affIdValue =
    (process.env.LAZADA_AFF_ID_VALUE || process.env.INVOLVEASIA_AFF_ID_VALUE || "").trim();

  try {
    const out = new URL(base);
    out.searchParams.set(deeplinkParam, productUrl);
    out.searchParams.set(subidParam, subid);
    if (affIdParam && affIdValue) out.searchParams.set(affIdParam, affIdValue);

    // Nudge toward web instead of app where supported
    out.searchParams.set("share_target", "browser");

    safeAppendTracking(out, subid);
    return out.toString();
  } catch {
    return null;
  }
}

/** Generic fallback if a network wrapper isn't available. */
export function appendSubid(productUrl: string, subid: string): string {
  try {
    const u = new URL(productUrl);
    safeAppendTracking(u, subid);
    return u.toString();
  } catch {
    return productUrl;
  }
}
