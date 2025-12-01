// lib/urls/cleanLazadaUrl.ts

/**
 * Normalize Lazada PH product URLs into a clean, affiliate-safe PDP URL.
 *
 * Examples:
 *  - Input:
 *    https://www.lazada.com.ph/products/pdp-i4320317981-s24265405129.html?pvid=...&sessionid=...
 *  - Output:
 *    https://www.lazada.com.ph/products/pdp-i4320317981-s24265405129.html
 *
 * Rules:
 *  - Only touch Lazada domains.
 *  - Keep pathname, drop query + hash.
 *  - Leave non-Lazada URLs unchanged.
 */
export function cleanLazadaUrl(rawUrl: string): string {
  if (!rawUrl) return rawUrl;

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    // Not a valid absolute URL; leave as-is
    return rawUrl;
  }

  const host = url.hostname.toLowerCase();

  // Only modify Lazada PH domains
  const isLazada =
    host === "www.lazada.com.ph" ||
    host === "lazada.com.ph" ||
    host.endsWith(".lazada.com.ph");

  if (!isLazada) {
    return rawUrl;
  }

  // Keep only the clean PDP path; drop all query/hash junk
  const cleanPath = url.pathname; // e.g. /products/pdp-i4320317981-s24265405129.html

  // Rebuild a canonical Lazada PH URL
  return `https://www.lazada.com.ph${cleanPath}`;
}
