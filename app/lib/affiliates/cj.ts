// app/lib/affiliates/cj.ts
// Helper to build Commission Junction (CJ) affiliate links

const PID = process.env.CJ_PID || "101525788"; // fallback to your PID; uses env in prod

/**
 * Build a CJ click-through link:
 * http://<domain>/click-<PID>-<clickId>
 */
export function cjClick(domain: string, clickId: number | string, pid = PID) {
  if (!domain) throw new Error("cjClick: domain required");
  if (!clickId) throw new Error("cjClick: clickId required");
  return `http://${domain}/click-${pid}-${clickId}`;
}

/**
 * Build a CJ 1x1 tracking image URL (rarely needed directly, but handy for testing)
 * http://<imgDomain>/image-<PID>-<imgId>
 */
export function cjPixel(imgDomain: string, imgId: number | string, pid = PID) {
  if (!imgDomain) throw new Error("cjPixel: imgDomain required");
  if (!imgId) throw new Error("cjPixel: imgId required");
  return `http://${imgDomain}/image-${pid}-${imgId}`;
}
