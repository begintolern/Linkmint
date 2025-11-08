// app/api/user/payouts/eligibility/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

function daysBetween(a: Date, b: Date) {
  const ms = Math.abs(b.getTime() - a.getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export async function GET(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    let userId: string | undefined = session?.user?.id || undefined;

    // Dev bypass (optional)
    const url = new URL(req.url);
    const devUserId = url.searchParams.get("devUserId") || undefined;
    const allowDev =
      process.env.ALLOW_DEV_PAYOUTS_REQUEST === "1" ||
      process.env.ALLOW_DEV_PAYOUTS_REQUEST_BYPASS === "1";
    if (!userId && allowDev && devUserId) userId = devUserId;

    if (!userId) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    // User basics
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        disabled: true,
        deletedAt: true,
      },
    });

    if (!user || user.disabled || user.deletedAt) {
      return NextResponse.json({ ok: false, error: "ACCOUNT_DISABLED" }, { status: 403 });
    }

    const daysSinceJoin = daysBetween(user.createdAt, new Date());
    const minDays = 30;

    // Approved, not yet paid commissions
    const approvedUnpaidCount = await prisma.commission.count({
      where: {
        userId,
        status: "APPROVED",
        paidOut: false,
      },
    });

    // Optional: total approved-unpaid PHP (if you store in cents/float)
    // Here: Commission.amount is Float in your schema
    const approvedUnpaidAgg = await prisma.commission.aggregate({
      where: { userId, status: "APPROVED", paidOut: false },
      _sum: { amount: true },
    });
    const approvedUnpaidPhp = Math.trunc((approvedUnpaidAgg._sum.amount || 0) as number);

    const eligible = daysSinceJoin >= minDays && approvedUnpaidCount > 0;

    // Friendly message
    let message = "";
    if (eligible) {
      message = "You are eligible to request a payout.";
    } else if (daysSinceJoin < minDays && approvedUnpaidCount < 1) {
      message =
        `Payouts unlock after ${minDays} days and require at least one APPROVED commission. ` +
        `You are at ${daysSinceJoin} days with 0 approved-unpaid commissions.`;
    } else if (daysSinceJoin < minDays) {
      message = `Payouts unlock after ${minDays} days. You are at ${daysSinceJoin} days.`;
    } else {
      message = "You need at least one APPROVED commission that hasn't been paid out yet.";
    }

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email },
      daysSinceJoin,
      minDays,
      approvedUnpaidCount,
      approvedUnpaidPhp,
      eligible,
      message,
    });
  } catch (err) {
    console.error("GET /api/user/payouts/eligibility error:", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
