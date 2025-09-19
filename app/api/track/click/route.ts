// app/api/track/click/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isSourceAllowed } from "@/lib/compliance/rules";
import { logEvent } from "@/lib/compliance/log";

export async function POST(req: Request) {
  try {
    const { userId, merchantId, source } = await req.json();

    if (!merchantId) {
      return NextResponse.json({ ok: false, error: "merchantId_required" }, { status: 400 });
    }

    const merchant = await prisma.merchantRule.findUnique({ where: { id: merchantId } });
    if (!merchant) {
      return NextResponse.json({ ok: false, error: "merchant_not_found" }, { status: 404 });
    }

    // 🔒 Block clicks from auto-suspended users
    if (userId) {
      const suspended = await prisma.userFlag.findFirst({
        where: { userId, reason: "AUTO_SUSPEND", status: "OPEN" },
        select: { id: true },
      });
      if (suspended) {
        await logEvent({
          type: "USER_BLOCKED",
          severity: 3,
          message: "Click blocked: user is auto-suspended",
          userId,
          merchantId,
        });
        return NextResponse.json({ ok: false, error: "USER_SUSPENDED" }, { status: 403 });
      }
    }

    // ✅ Self-check: is this source allowed for the merchant?
    const src = (source || "unknown").toString().toLowerCase();
    if (!isSourceAllowed(merchant, src)) {
      await logEvent({
        type: "DISALLOWED_SOURCE",
        severity: 2,
        message: `Blocked click: ${src} not allowed`,
        userId: userId ?? null,
        merchantId,
        meta: { source: src, merchant: merchant.merchantName },
      });
      return NextResponse.json({ ok: false, error: "DISALLOWED_SOURCE" }, { status: 403 });
    }

    // 📝 Record click
    await prisma.clickEvent.create({
      data: {
        userId: userId ?? null,
        merchantId,
        source: src,
      },
    });

    await logEvent({
      type: "CLICK_RECORDED",
      severity: 1,
      message: `Click recorded (${src})`,
      userId: userId ?? null,
      merchantId,
      meta: { source: src },
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
