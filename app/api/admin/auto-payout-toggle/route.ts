// app/api/admin/auto-payout-toggle/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { runAutoPayoutEngine } from "@/lib/engines/autoPayoutEngine";

export async function POST(req: Request) {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Ensure ADMIN
    const role = (token as any).role ?? null;
    if (String(role || "").toUpperCase() !== "ADMIN") {
      const me = await prisma.user.findUnique({
        where: { email: token.email as string },
        select: { role: true },
      });
      if (!me || String(me.role).toUpperCase() !== "ADMIN") {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    // Flip the setting
    const key = "autoPayoutEnabled";
    const cur = await prisma.systemSetting.findUnique({ where: { key } });
    const current = cur?.value === "true";
    const next = !current;

    await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value: next ? "true" : "false" },
      update: { value: next ? "true" : "false" },
    });

    let triggered = false;

    // If enabling, immediately run the engine once
    if (next) {
      try {
        await runAutoPayoutEngine();
        triggered = true;
        await prisma.eventLog.create({
          data: {
            type: "payout",
            message: "Auto-payout toggled ON → engine run triggered",
          },
        });
      } catch (e) {
        console.error("Auto-payout immediate run failed:", e);
        await prisma.eventLog.create({
          data: {
            type: "error",
            message: `Auto-payout immediate run failed: ${String(e)}`,
          },
        });
      }
    } else {
      await prisma.eventLog.create({
        data: { type: "payout", message: "Auto-payout toggled OFF" },
      });
    }

    return NextResponse.json({ success: true, value: next, triggered });
  } catch (err) {
    console.error("auto-payout-toggle POST error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
