// app/api/payouts/request/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import {
  PayoutMethod as PM,
  PayoutProvider as PP,
  PayoutStatus as PS,
} from "@prisma/client";

function toPhpInt(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function daysSince(d: Date) {
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    const userId: string | undefined = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({} as any));
    const amountPhp = toPhpInt(body?.amountPhp);
    const methodRaw = String(body?.method || "").toUpperCase();
    const gcashNumber = typeof body?.gcashNumber === "string" ? body.gcashNumber.trim() : "";
    const bankName = typeof body?.bankName === "string" ? body.bankName.trim() : "";
    const bankAccountNumber =
      typeof body?.bankAccountNumber === "string" ? body.bankAccountNumber.trim() : "";

    if (amountPhp < 1) {
      return NextResponse.json({ success: false, error: "INVALID_AMOUNT" }, { status: 400 });
    }

    // Map method string -> Prisma enum
    let methodEnum: PM | null = null;
    if (methodRaw === "GCASH") methodEnum = PM.GCASH;
    if (methodRaw === "BANK") methodEnum = PM.BANK;
    if (!methodEnum) {
      return NextResponse.json({ success: false, error: "UNSUPPORTED_METHOD" }, { status: 400 });
    }

    // Basic user checks
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, createdAt: true, disabled: true, deletedAt: true },
    });
    if (!user || user.disabled || user.deletedAt) {
      return NextResponse.json({ success: false, error: "ACCOUNT_DISABLED" }, { status: 403 });
    }

    // Honeymoon gate
    const minDays = 30;
    const joinedDays = daysSince(user.createdAt);
    if (joinedDays < minDays) {
      return NextResponse.json(
        {
          success: false,
          error: "HONEYPERIOD_LOCK",
          message: `Payouts unlock after ${minDays} days. Currently ${joinedDays} days since join.`,
        },
        { status: 400 }
      );
    }

    // Must have APPROVED unpaid commissions
    const approvedUnpaidCount = await prisma.commission.count({
      where: { userId, status: "APPROVED", paidOut: false },
    });
    if (approvedUnpaidCount < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "NO_ELIGIBLE_COMMISSIONS",
          message: "You don’t have approved commissions available for payout yet.",
        },
        { status: 400 }
      );
    }

    // Cap request to approved unpaid sum
    const approvedAgg = await prisma.commission.aggregate({
      where: { userId, status: "APPROVED", paidOut: false },
      _sum: { amount: true },
    });
    const approvedUnpaidPhp = Math.trunc((approvedAgg._sum.amount ?? 0) as number);
    if (amountPhp > approvedUnpaidPhp) {
      return NextResponse.json(
        {
          success: false,
          error: "AMOUNT_EXCEEDS_APPROVED",
          message: `You can request up to ₱${approvedUnpaidPhp} based on approved unpaid commissions.`,
        },
        { status: 400 }
      );
    }

    // Method-specific input checks and normalizing
    let gcash: string | null = null;
    let bName: string | null = null;
    let bAcct: string | null = null;

    if (methodEnum === PM.GCASH) {
      if (!/^\d{11}$/.test(gcashNumber)) {
        return NextResponse.json({ success: false, error: "INVALID_GCASH_NUMBER" }, { status: 400 });
      }
      gcash = gcashNumber;
    } else if (methodEnum === PM.BANK) {
      if (!bankName || bankName.length < 3) {
        return NextResponse.json({ success: false, error: "INVALID_BANK_NAME" }, { status: 400 });
      }
      if (!bankAccountNumber || bankAccountNumber.length < 6) {
        return NextResponse.json({ success: false, error: "INVALID_BANK_ACCOUNT" }, { status: 400 });
      }
      bName = bankName;
      bAcct = bankAccountNumber;
    }

    // Create request using **enum values**
    const created = await prisma.payoutRequest.create({
      data: {
        userId,
        amountPhp,
        method: methodEnum,            // <- enum
        provider: PP.MANUAL,           // <- enum
        status: PS.PENDING,            // <- enum
        requestedAt: new Date(),
        gcashNumber: gcash,
        bankName: bName,
        bankAccountNumber: bAcct,
      },
      select: {
        id: true,
        userId: true,
        amountPhp: true,
        method: true,
        provider: true,
        status: true,
        requestedAt: true,
      },
    });

    // Optional log
    try {
      await prisma.systemLog.create({
        data: {
          id: `payout_req_${created.id}`,
          type: "PAYOUT_REQUEST",
          message: `Payout request created (${created.method}/${created.provider})`,
          json: JSON.stringify(created),
        },
      });
    } catch {
      /* ignore */
    }

    return NextResponse.json({ success: true, requestId: created.id });
  } catch (err: any) {
    console.error("POST /api/payouts/request error:", err);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", detail: err?.message || "unknown" },
      { status: 500 }
    );
  }
}
