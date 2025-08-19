// app/api/simulate-purchase/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";

export async function POST(req: Request) {
  try {
    const gate = await adminGuard();
    if (!gate.ok) {
      return NextResponse.json({ error: gate.reason }, { status: gate.status });
    }

    const body = (await req.json().catch(() => ({}))) as {
      userEmail?: string;
      amount?: number | string;
      source?: string;
    };

    const userEmail = String(body.userEmail ?? "").trim().toLowerCase();
    const amountNum = Number(body.amount ?? 4.55);
    const source = String(body.source ?? "TEST_AMAZON");

    if (!userEmail) {
      return NextResponse.json({ error: "userEmail is required" }, { status: 400 });
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const payout = await prisma.payout.create({
      data: {
        userId: user.id,
        amount: amountNum,
        status: "Pending" as any, // cast to your enum if applicable
        source,
      } as any,
    });

    return NextResponse.json({ success: true, payoutId: payout.id });
  } catch (err) {
    console.error("simulate-purchase error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
