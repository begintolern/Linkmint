export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { logEvent } from "@/lib/compliance/log";

export async function POST(req: Request) {
  try {
    const { userId, merchantId, orderId, amount, source, status } = await req.json();
    if (!merchantId) {
      return NextResponse.json({ ok: false, error: "merchantId_required" }, { status: 400 });
    }

    const conv = await prisma.conversion.create({
      data: {
        userId: userId ?? null,
        merchantId,
        orderId: orderId ?? null,
        amount: amount ? new Prisma.Decimal(amount) : null,
        source: source ?? null,
        status: status ?? "PENDING",
      },
    });

    await logEvent({
      type: "CONVERSION_RECORDED",
      severity: 1,
      message: `Conversion recorded for merchant ${merchantId}`,
      userId: userId ?? null,
      merchantId,
      meta: { orderId, amount, status, source },
    });

    return NextResponse.json({ ok: true, conversion: conv });
  } catch (err) {
    console.error("track/conversion POST failed:", err);
    await logEvent({
      type: "CONVERSION_ERROR",
      severity: 3,
      message: "Track conversion failed",
      meta: { error: String(err) },
    });
    return NextResponse.json({ ok: false, error: "CONVERSION_FAILED" }, { status: 500 });
  }
}
