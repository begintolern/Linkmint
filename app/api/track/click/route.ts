export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { isSourceAllowed } from "@/lib/compliance/rules";
import { logEvent } from "@/lib/compliance/log";

/** ---------------- Rate limiting (simple in-memory per-IP) ----------------
 * Allows up to 5 requests/second and 200 requests/hour per IP.
 * Good enough for serverless instances; for heavy prod, move to Redis.
 */
type Bucket = { secCount: number; secTs: number; hourCount: number; hourTs: number };
const buckets = new Map<string, Bucket>();
function rateLimit(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip) ?? { secCount: 0, secTs: now, hourCount: 0, hourTs: now };

  // reset 1s window
  if (now - b.secTs >= 1000) { b.secTs = now; b.secCount = 0; }
  // reset 1h window
  if (now - b.hourTs >= 3600_000) { b.hourTs = now; b.hourCount = 0; }

  b.secCount += 1;
  b.hourCount += 1;
  buckets.set(ip, b);

  return b.secCount <= 5 && b.hourCount <= 200;
}

function getIp(req: NextRequest): string {
  const h = req.headers;
  const cand =
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("cf-connecting-ip") ||
    h.get("fly-client-ip") ||
    "";
  return cand || "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const ua = req.headers.get("user-agent") ?? "unknown";

  try {
    // ------------ Basic rate-limit gate ------------
    if (!rateLimit(ip)) {
      await logEvent({
        type: "RATE_LIMITED",
        severity: 2,
        message: "Click blocked by rate limiter",
        meta: { ip, ua },
      });
      return NextResponse.json({ ok: false, error: "RATE_LIMITED" }, { status: 429 });
    }

    const { userId, userEmail, merchantId, source } = await req.json();

    if (!merchantId) {
      return NextResponse.json({ ok: false, error: "merchantId_required" }, { status: 400 });
    }

    // Merchant sanity checks
    const merchant = await prisma.merchantRule.findUnique({ where: { id: merchantId } });
    if (!merchant) {
      return NextResponse.json({ ok: false, error: "merchant_not_found" }, { status: 404 });
    }
    if (merchant.active === false || merchant.status === "DISABLED") {
      await logEvent({
        type: "CLICK_BLOCKED",
        severity: 2,
        message: "Merchant inactive/disabled",
        merchantId,
      });
      return NextResponse.json({ ok: false, error: "MERCHANT_INACTIVE" }, { status: 403 });
    }

    // Resolve userId from email (optional convenience)
    let resolvedUserId: string | null = userId ?? null;
    if (!resolvedUserId && typeof userEmail === "string" && userEmail.includes("@")) {
      const u = await prisma.user.findUnique({ where: { email: userEmail } }).catch(() => null);
      resolvedUserId = u?.id ?? null;
    }

    // Block auto-suspended users
    if (resolvedUserId) {
      const suspended = await prisma.userFlag.findFirst({
        where: { userId: resolvedUserId, reason: "AUTO_SUSPEND", status: "OPEN" },
        select: { id: true },
      });
      if (suspended) {
        await logEvent({
          type: "USER_BLOCKED",
          severity: 3,
          message: "Click blocked: user is auto-suspended",
          userId: resolvedUserId,
          merchantId,
          meta: { ip, ua },
        });
        return NextResponse.json({ ok: false, error: "USER_SUSPENDED" }, { status: 403 });
      }
    }

    // Source policy enforcement
    const src = (source || "unknown").toString().toLowerCase();
    if (!isSourceAllowed(merchant, src)) {
      await logEvent({
        type: "DISALLOWED_SOURCE",
        severity: 2,
        message: `Blocked click: ${src} not allowed`,
        userId: resolvedUserId,
        merchantId,
        meta: { ip, ua, source: src, merchant: merchant.merchantName },
      });
      return NextResponse.json({ ok: false, error: "DISALLOWED_SOURCE" }, { status: 403 });
    }

    // Record click (types in Docker may be stale; force-cast to any)
// 1) Create without ip/userAgent (old Prisma client accepts this)
const created = await prisma.clickEvent.create({
  data: {
    userId: resolvedUserId,
    merchantId,
    source: src,
  },
});

// 2) Then update ip/userAgent using SQL (bypasses stale client types)
await prisma.$executeRaw`
  UPDATE "ClickEvent"
     SET "ip" = ${ip}, "userAgent" = ${ua}
   WHERE "id" = ${created.id}
`;



    await logEvent({
      type: "CLICK_RECORDED",
      severity: 1,
      message: `Click recorded (${src})`,
      userId: resolvedUserId,
      merchantId,
      meta: { ip, ua, source: src },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("track/click POST failed:", err);
    await logEvent({
      type: "CLICK_ERROR",
      severity: 3,
      message: "Track click failed",
      meta: { error: String(err), ip, ua },
    });
    return NextResponse.json({ ok: false, error: "CLICK_FAILED" }, { status: 500 });
  }
}
