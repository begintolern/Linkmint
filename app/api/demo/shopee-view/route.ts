// app/api/demo/shopee-view/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const userAgent = request.headers.get("user-agent") || null;
    const referer = request.headers.get("referer") || null;

    // Optional: capture IP if available (will often be something like "x.x.x.x, proxy")
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      null;

    await prisma.eventLog.create({
      data: {
        type: "DEMO_SHOPEE_VIEW",
        detail: "Shopee demo page viewed",
        message: JSON.stringify({
          path: "/demo/shopee",
          userAgent,
          referer,
          ip,
          ts: new Date().toISOString(),
        }),
        // severity will default to 1
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[demo-shopee-view] Error logging view:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
