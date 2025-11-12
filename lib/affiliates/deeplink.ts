// lib/affiliates/deeplink.ts
// Central helpers for creating affiliate shortlinks and subids.
// These exports are used by /api/smartlinks and other engines.

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

/** Build an Involve Asia short link if env is configured; otherwise return null. */
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

/** Build an ACCESSTRADE short link if env is configured; otherwise return null. */
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

/** Optional convenience: ensure we always have a URL (fallback to direct with tagging). */
export function fallbackTagUrl(productUrl: string, subid: string): string {
  try {
    const u = new URL(productUrl);
    if (!u.searchParams.has("lm_subid")) u.searchParams.set("lm_subid", subid);
    if (!u.searchParams.has("utm_source")) u.searchParams.set("utm_source", "linkmint");
    return u.toString();
  } catch {
    return productUrl;
  }
}
