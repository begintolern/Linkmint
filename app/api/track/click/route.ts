// app/api/track/click/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isSourceAllowed } from "@/lib/compliance/rules";
import { logEvent } from "@/lib/compliance/log";

export async function POST(req: Request) {
  try {
    const { userId, userEmail, merchantId, source } = await req.json();

    if (!merchantId) {
      return NextResponse.json({ ok: false, error: "merchantId_required" }, { status: 400 });
    }

    const merchant = await prisma.merchantRule.findUnique({ where: { id: merchantId } });
    if (!merchant) {
      return NextResponse.json({ ok: false, error: "merchant_not_found" }, { status: 404 });
    }

    // Resolve userId from email if needed
    let resolvedUserId: string | null = userId ?? null;
    if (!resolvedUserId && typeof userEmail === "string" && userEmail.includes("@")) {
      const u = await prisma.user.findUnique({ where: { email: userEmail } }).catch(() => null);
      resolvedUserId = u?.id ?? null;
    }

    // 🔒 Block clicks from auto-suspended users
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
        });
        return NextResponse.json({ ok: false, error: "USER_SUSPENDED" }, { status: 403 });
      }
    }

    // ✅ Self-check: is this source allowed?
    const src = (source || "unknown").toString().toLowerCase();
    if (!isSourceAllowed(merchant, src)) {
      await logEvent({
        type: "DISALLOWED_SOURCE",
        severity: 2,
        message: `Blocked click: ${src} not allowed`,
        userId: resolvedUserId,
        merchantId,
        meta: { source: src, merchant: merchant.merchantName },
      });
      return NextResponse.json({ ok: false, error: "DISALLOWED_SOURCE" }, { status: 403 });
    }

    // 📝 Record click
    await prisma.clickEvent.create({
      data: { userId: resolvedUserId, merchantId, source: src },
    });

    await logEvent({
      type: "CLICK_RECORDED",
      severity: 1,
      message: `Click recorded (${src})`,
      userId: resolvedUserId,
      merchantId,
      meta: { source: src, via: userId ? "userId" : userEmail ? "userEmail" : "anon" },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("track/click POST failed:", err);
    await logEvent({
      type: "CLICK_ERROR",
      severity: 3,
      message: "Track click failed",
      meta: { error: String(err) },
    });
    return NextResponse.json({ ok: false, error: "CLICK_FAILED" }, { status: 500 });
  }
}
