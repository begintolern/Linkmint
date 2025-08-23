// app/api/simulate-commission/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { recordCommission } from "@/lib/engines/recordCommission";
import { CommissionType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    // ✅ JWT-based admin auth (same pattern as auto-payout toggle)
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
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

    // Pick a user to receive the commission (oldest account)
    const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
    if (!user) {
      return NextResponse.json({ success: false, error: "No user found" }, { status: 404 });
    }

    // Simulate a commission and let recordCommission handle splits/override
    const result = await recordCommission({
      userId: user.id,
      amount: 4.55,
      type: CommissionType.referral_purchase,
      source: "SANDBOX",
      description: "Simulated commission for testing",
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error("simulate-commission error:", err?.message || err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
