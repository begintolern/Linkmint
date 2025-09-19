// app/api/track/click/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { isSourceAllowed } from "@/lib/compliance/rules";
import { logEvent } from "@/lib/compliance/log";

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

type Bucket = { secCount: number; secTs: number; hourCount: number; hourTs: number };
const buckets = new Map<string, Bucket>();
function rateLimit(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip) ?? { secCount: 0, secTs: now, hourCount: 0, hourTs: now };
  if (now - b.secTs >= 1000) { b.secTs = now; b.secCount = 0; }
  if (now - b.hourTs >= 3600_000) { b.hourTs = now; b.hourCount = 0; }
  b.secCount += 1; b.hourCount += 1;
  buckets.set(ip, b);
  return b.secCount <= 5 && b.hourCount <= 200;
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const ua = req.headers.get("user-agent") ?? "unknown";

  try {
    if (!rateLimit(ip)) {
      await logEvent({ type: "RATE_LIMITED", severity: 2, message: "Click blocked by rate limiter", meta: { ip, ua }});
      return NextResponse.json({ ok: false, error: "RATE_LIMITED" }, { status: 429 });
    }

    const { userId, userEmail, merchantId, source } = await req.json();
    // … keep the rest of your handler the same …
    // When creating the click, ensure ip/ua are written:
    await prisma.clickEvent.create({
      data: {
        userId: userId ?? null,
        merchantId,
        source: (source || "unknown").toString().toLowerCase(),
        ip,
        userAgent: ua,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    await logEvent({ type: "CLICK_ERROR", severity: 3, message: "Track click failed", meta: { error: String(err), ip, ua }});
    return NextResponse.json({ ok: false, error: "CLICK_FAILED" }, { status: 500 });
  }
}
