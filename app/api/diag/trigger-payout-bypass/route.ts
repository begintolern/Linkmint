// app/api/diag/trigger-payout-bypass/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

const ALLOW = new Set<string>(["epo78741@yahoo.com", "admin@linkmint.co"]);
const VERSION = "v3-method-field-PAYPAL-provider";

export async function GET() {
  // Simple version ping so we can confirm deploy content
  return NextResponse.json({ ok: true, route: "trigger-payout-bypass", version: VERSION });
}

type PostBody = { commissionId?: string };

export async function POST(req: Request) {
  try {
    const raw = await getServerSession(authOptions);
    const session = raw as Session | null;
    const email = session?.user?.email ?? "";
    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized (no session)" }, { status: 401 });
    }
    if (!ALLOW.has(email.toLowerCase())) {
      return NextResponse.json({ success: false, error: "Forbidden (not allowlisted)" }, { status: 403 });
    }

    const { commissionId } = (await req.json()) as PostBody;
    if (!commissionId) {
      return NextResponse.json({ success: false, error: "commissionId is required" }, { status: 400 });
    }

    const commission = await prisma.commission.findUnique({
      where: { id: commissionId },
      select: { id: true, userId: true, amount: true, status: true, type: true },
    });
    if (!commission) {
      return NextResponse.json({ success: false, error: "Commission not found" }, { status: 404 });
    }

    // IMPORTANT: your DB enums are:
    //   PayoutStatus: PENDING | PROCESSING | PAID | FAILED
    //   PayoutProvider: PAYPAL | PAYONEER
    // And your schema REQUIRES `method` (String).
    // We set provider=PAYPAL and method="PAYPAL".
    const payout = await prisma.payout.create({
      data: {
        userId: commission.userId,
        commissionId: commission.id,
        amount: commission.amount,
        status: "PROCESSING" as any, // PayoutStatus
        provider: "PAYPAL" as any,   // PayoutProvider
        method: "PAYPAL",            // REQUIRED string
        providerRef: `SIM-${Date.now()}`,
        meta: { note: "diag trigger-payout-bypass", version: VERSION } as any,
      } as any,
      select: { id: true, status: true, amount: true, provider: true, method: true },
    });

    const [payoutFinal, commissionFinal] = await prisma.$transaction([
      prisma.payout.update({
        where: { id: payout.id },
        data: { status: "PAID" as any },
        select: { id: true, status: true, provider: true, method: true },
      }),
      prisma.commission.update({
        where: { id: commission.id },
        data: { status: "PAID" as any },
        select: { id: true, status: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      version: VERSION,
      message: "Payout simulated: PAID",
      payout: payoutFinal,
      commission: commissionFinal,
    });
  } catch (err: any) {
    console.error("[diag trigger-payout-bypass] error:", err);
    return NextResponse.json({ success: false, error: err?.message ?? "Internal error", version: VERSION }, { status: 500 });
  }
}
