// lib/affiliates/deeplink.ts
// Central helpers for creating affiliate shortlinks and subids,
// used by /api/smartlink, /api/smartlinks, and the shortlink redirector.

function safeTrim(v?: string | null) {
  return (v ?? "").toString().trim();
}

export function genSubId(): string {
  try {
    // Prefer crypto uuid if available (Node 18+/Edge runtimes)
    // @ts-ignore
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch {}
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Generic URL param setter with basic safety */
function setParams(baseUrl: string, kv: Record<string, string>): string | null {
  try {
    const u = new URL(baseUrl);
    for (const [k, v] of Object.entries(kv)) {
      if (safeTrim(k)) u.searchParams.set(k, safeTrim(v));
    }
    return u.toString();
  } catch {
    return null;
  }
}

/** Append our tracking params to a raw merchant URL (final fallback). */
export function appendSubid(productUrl: string, subid: string): string {
  try {
    const u = new URL(productUrl);
    if (!u.searchParams.has("lm_subid")) u.searchParams.set("lm_subid", subid);
    if (!u.searchParams.has("utm_source")) u.searchParams.set("utm_source", "linkmint");
    return u.toString();
  } catch {
    return productUrl;
  }
}

/** Back-compat alias some code may still call. */
export function fallbackTagUrl(productUrl: string, subid: string): string {
  return appendSubid(productUrl, subid);
}

/** Involve Asia link builder (generic, works for any IA merchant) */
export async function createInvolveAsiaShortlink(args: {
  productUrl: string;
  subid: string;
}): Promise<string | null> {
  const base = safeTrim(process.env.INVOLVEASIA_BASE_URL);
  if (!base) return null;

  const deeplinkParam = safeTrim(process.env.INVOLVEASIA_DEEPLINK_PARAM) || "url";
  const subidParam = safeTrim(process.env.INVOLVEASIA_SUBID_PARAM) || "aff_sub";
  const affIdParam = safeTrim(process.env.INVOLVEASIA_AFF_ID_PARAM);
  const affIdValue = safeTrim(process.env.INVOLVEASIA_AFF_ID_VALUE);

  const params: Record<string, string> = {
    [deeplinkParam]: args.productUrl,
    [subidParam]: args.subid,
    lm_subid: args.subid,
    utm_source: "linkmint",
  };
  if (affIdParam && affIdValue) params[affIdParam] = affIdValue;

  return setParams(base, params);
}

/** ACCESSTRADE link builder (often used for Shopee/Lazada in PH if configured) */
export async function createAccesstradeShortlink(args: {
  productUrl: string;
  subid: string;
}): Promise<string | null> {
  const base = safeTrim(process.env.ACCESSTRADE_BASE_URL);
  if (!base) return null;

  const deeplinkParam = safeTrim(process.env.ACCESSTRADE_DEEPLINK_PARAM) || "url";
  const subidParam = safeTrim(process.env.ACCESSTRADE_SUBID_PARAM) || "sub_id";
  const affIdParam = safeTrim(process.env.ACCESSTRADE_AFF_ID_PARAM);
  const affIdValue = safeTrim(process.env.ACCESSTRADE_AFF_ID_VALUE);

  const params: Record<string, string> = {
    [deeplinkParam]: args.productUrl,
    [subidParam]: args.subid,
    lm_subid: args.subid,
    utm_source: "linkmint",
  };
  if (affIdParam && affIdValue) params[affIdParam] = affIdValue;

  return setParams(base, params);
}

/** Shopee Affiliate direct builder (only if you’ve set explicit Shopee envs) */
export async function createShopeeShortlink(args: {
  productUrl: string;
  subid: string;
}): Promise<string | null> {
  const base = safeTrim(process.env.SHOPEE_BASE_URL);
  if (!base) return null;

  const deeplinkParam = safeTrim(process.env.SHOPEE_DEEPLINK_PARAM) || "url";
  const subidParam = safeTrim(process.env.SHOPEE_SUBID_PARAM) || "subid";
  const affIdParam = safeTrim(process.env.SHOPEE_AFF_ID_PARAM);
  const affIdValue = safeTrim(process.env.SHOPEE_AFF_ID_VALUE);

  const params: Record<string, string> = {
    [deeplinkParam]: args.productUrl,
    [subidParam]: args.subid,
    lm_subid: args.subid,
    utm_source: "linkmint",
  };
  if (affIdParam && affIdValue) params[affIdParam] = affIdValue;

  return setParams(base, params);
}

/**
 * Build a tracked Shopee URL:
 * 1) Shopee Affiliate direct (if env present)
 * 2) ACCESSTRADE (if configured)
 * 3) Involve Asia (if configured)
 * 4) Fallback to tagging the merchant URL
 */
export async function buildShopeeUrl(productUrl: string, subid: string): Promise<string> {
  const viaShopee = await createShopeeShortlink({ productUrl, subid });
  if (viaShopee) return viaShopee;

  const viaAT = await createAccesstradeShortlink({ productUrl, subid });
  if (viaAT) return viaAT;

  const viaIA = await createInvolveAsiaShortlink({ productUrl, subid });
  if (viaIA) return viaIA;

  return appendSubid(productUrl, subid);
}

/**
 * Build a tracked Lazada URL:
 * 1) ACCESSTRADE (if configured)
 * 2) Involve Asia (if configured)
 * 3) Fallback to tagging the merchant URL
 */
export async function buildLazadaUrl(productUrl: string, subid: string): Promise<string> {
  const viaAT = await createAccesstradeShortlink({ productUrl, subid });
  if (viaAT) return viaAT;

  const viaIA = await createInvolveAsiaShortlink({ productUrl, subid });
  if (viaIA) return viaIA;

  return appendSubid(productUrl, subid);
}

/**
 * Build a tracked Razer URL (via Involve Asia):
 * 1) Involve Asia shortlink (if configured)
 * 2) Fallback: tag the raw Razer URL
 */
export async function buildRazerUrl(productUrl: string, subid: string): Promise<string> {
  const viaIA = await createInvolveAsiaShortlink({ productUrl, subid });
  if (viaIA) return viaIA;

  return appendSubid(productUrl, subid);
}
