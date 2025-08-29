// app/api/admin/simulate-commission/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

// VERSION TAG so we can verify deployment is live
const VERSION = "v2-requires-type-and-PENDING-status";
const ADMIN_EMAILS = new Set<string>(["epo78741@yahoo.com", "admin@linkmint.co"]);

type PostBody = { userId?: string; amount?: number; type?: string };

// Simple GET probe so we can confirm the new file is deployed
export async function GET() {
  return NextResponse.json({ ok: true, route: "admin/simulate-commission", version: VERSION });
}

export async function POST(req: Request) {
  try {
    const raw = await getServerSession(authOptions);
    const session = raw as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Allowlist or role check
    const sessionRole = String((session.user as any).role ?? "").toUpperCase();
    const isAdmin = sessionRole === "ADMIN" || ADMIN_EMAILS.has(session.user.email.toLowerCase());
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as PostBody;
    const userId = body.userId?.trim();
    const amount = Number(body.amount);
    // REQUIRED by your DB (from enum inspector): referral_purchase | override_bonus | payout
    const type = (body.type ?? "referral_purchase").toString();

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: "amount must be > 0" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!target) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Use exact enums we discovered:
    //   PayoutStatus: PENDING | PROCESSING | PAID | FAILED
    //   CommissionType: referral_purchase | override_bonus | payout
    const commission = await prisma.commission.create({
      data: {
        userId: target.id,
        amount,
        status: "PENDING" as any,
        type: type as any,
      } as any,
      select: { id: true, userId: true, amount: true, status: true, type: true },
    });

    return NextResponse.json({
      success: true,
      version: VERSION,
      message: "Simulated commission created (admin route).",
      commission,
    });
  } catch (err: any) {
    console.error("[admin simulate-commission] error:", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error", version: VERSION },
      { status: 500 }
    );
  }
}
