// lib/affiliates/deeplink.ts
/**
 * Lightweight wrappers for deeplink APIs.
 * - If env keys/paths are missing or the API call fails, these return null.
 * - We keep endpoints configurable via env so we don't hardcode possibly-wrong paths.
 *
 * Required env (set what you actually have):
 *   INVOLVEASIA_API_BASE
 *   INVOLVEASIA_API_KEY
 *   INVOLVEASIA_DEEPLINK_PATH   (e.g., "/publisher/v3/deeplink")  // set in .env.local
 *
 *   ACCESSTRADE_API_BASE
 *   ACCESSTRADE_API_KEY
 *   ACCESSTRADE_DEEPLINK_PATH   (e.g., "/v1/deeplink")            // set in .env.local
 */

export async function createInvolveAsiaShortlink(opts: {
  productUrl: string;
  subId?: string;
}): Promise<string | null> {
  const base = (process.env.INVOLVEASIA_API_BASE || "").trim();
  const key = (process.env.INVOLVEASIA_API_KEY || "").trim();
  const path = (process.env.INVOLVEASIA_DEEPLINK_PATH || "").trim(); // keep configurable

  if (!base || !key || !path) return null;

  const url = base.replace(/\/$/, "") + path;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        url: opts.productUrl,
        subId: opts.subId ?? undefined,
      }),
      // avoid caching
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json().catch(() => null);
    // Try a few common shapes; fall back to null if nothing matches
    const candidate =
      data?.shortlink ||
      data?.shortLink ||
      data?.data?.shortlink ||
      data?.data?.shortLink ||
      data?.result?.shortlink ||
      data?.result?.shortLink ||
      null;

    return typeof candidate === "string" && candidate.startsWith("http")
      ? candidate
      : null;
  } catch {
    return null;
  }
}

export async function createAccesstradeShortlink(opts: {
  productUrl: string;
  subId?: string;
}): Promise<string | null> {
  const base = (process.env.ACCESSTRADE_API_BASE || "").trim();
  const key = (process.env.ACCESSTRADE_API_KEY || "").trim();
  const path = (process.env.ACCESSTRADE_DEEPLINK_PATH || "").trim();

  if (!base || !key || !path) return null;

  const url = base.replace(/\/$/, "") + path;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        url: opts.productUrl,
        subId: opts.subId ?? undefined,
      }),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json().catch(() => null);
    const candidate =
      data?.shortlink ||
      data?.shortLink ||
      data?.data?.shortlink ||
      data?.data?.shortLink ||
      data?.result?.shortlink ||
      data?.result?.shortLink ||
      null;

    return typeof candidate === "string" && candidate.startsWith("http")
      ? candidate
      : null;
  } catch {
    return null;
  }
}

/** Small helper to generate a safe subId when we don't yet have the smartLink id */
export function genSubId(): string {
  try {
    // @ts-ignore
    if (globalThis?.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch {}
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}
