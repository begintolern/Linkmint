// app/api/payouts/request/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type PayoutMethod = "GCASH" | "BANK";
type PayoutProvider = "PAYPAL" | "PAYONEER" | "MANUAL" | "XENDIT" | "PAYMONGO";

function toInt(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function daysBetween(a: Date, b: Date) {
  const ms = Math.abs(b.getTime() - a.getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export async function POST(req: Request) {
  try {
    // 1) Auth
    const session: any = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const userId = session.user.id as string;

    // 2) Parse
    const body = await req.json().catch(() => ({} as any));
    const amountPhp = toInt(body?.amountPhp);
    const method = String(body?.method || "").toUpperCase() as PayoutMethod;

    const gcashNumber = typeof body?.gcashNumber === "string" ? body.gcashNumber.trim() : undefined;
    const bankName = typeof body?.bankName === "string" ? body.bankName.trim() : undefined;
    const bankAccountNumber =
      typeof body?.bankAccountNumber === "string" ? body.bankAccountNumber.trim() : undefined;

    if (!amountPhp || amountPhp <= 0) {
      return NextResponse.json({ success: false, error: "INVALID_AMOUNT" }, { status: 400 });
    }
    if (method !== "GCASH" && method !== "BANK") {
      return NextResponse.json({ success: false, error: "UNSUPPORTED_METHOD" }, { status: 400 });
    }

    // 3) Load user + basic account constraints
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        defaultGcashNumber: true,
        defaultBankName: true,
        defaultBankAccountNumber: true,
        disabled: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt || user.disabled) {
      return NextResponse.json({ success: false, error: "ACCOUNT_DISABLED" }, { status: 403 });
    }

    // 4) Eligibility gate — APPROVED commissions present + honeymoon check
    const approvedUnpaidCount = await prisma.commission.count({
      where: {
        userId,
        status: "APPROVED",
        paidOut: false,
      },
    });

    if (approvedUnpaidCount < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "NO_ELIGIBLE_COMMISSIONS",
          message:
            "You don’t have approved commissions available for payout yet. Only approved commissions are payable.",
        },
        { status: 400 }
      );
    }

    const joinDays = daysBetween(user.createdAt, new Date());
    if (joinDays < 30) {
      return NextResponse.json(
        {
          success: false,
          error: "HONEYPERIOD",
          message:
            "Payouts unlock after your first 30 days (honeymoon period). This helps us prevent fraud and chargebacks.",
          details: { daysSinceJoin: joinDays, daysRequired: 30 },
        },
        { status: 403 }
      );
    }

    // 5) Method-specific validation + provider mapping
    let provider: PayoutProvider;
    let saveGcash: string | undefined;
    let saveBankName: string | undefined;
    let saveBankAcct: string | undefined;

    if (method === "GCASH") {
      const gcash = gcashNumber || user.defaultGcashNumber || "";
      if (!/^\d{11}$/.test(gcash)) {
        return NextResponse.json({ success: false, error: "INVALID_GCASH_NUMBER" }, { status: 400 });
      }
      provider = "MANUAL"; // future: XENDIT/PAYMONGO
      saveGcash = gcash;
    } else {
      const name = bankName || user.defaultBankName || "";
      const acct = bankAccountNumber || user.defaultBankAccountNumber || "";
      if (!name || name.length < 3) {
        return NextResponse.json({ success: false, error: "INVALID_BANK_NAME" }, { status: 400 });
      }
      if (!acct || acct.length < 6) {
        return NextResponse.json({ success: false, error: "INVALID_BANK_ACCOUNT" }, { status: 400 });
      }
      provider = "MANUAL";
      saveBankName = name;
      saveBankAcct = acct;
    }

    // 6) Create payout request
    const created = await prisma.payoutRequest.create({
      data: {
        userId,
        amountPhp,
        method,
        provider,
        gcashNumber: saveGcash,
        bankName: saveBankName,
        bankAccountNumber: saveBankAcct,
      },
      select: {
        id: true,
        status: true,
        provider: true,
        method: true,
        amountPhp: true,
        createdAt: true,
      },
    });

    // 7) Optional log
    try {
      await prisma.systemLog.create({
        data: {
          id: `payout_req_${created.id}`,
          type: "PAYOUT_REQUEST",
          message: `Payout request created (${method}/${provider})`,
          json: JSON.stringify({ userId, method, provider, amountPhp }),
        },
      });
    } catch {
      // ignore
    }

    // 8) Done
    return NextResponse.json({
      success: true,
      request: created,
      note:
        method === "GCASH"
          ? "Your GCash payout request is recorded and will be processed manually."
          : "Your bank payout request is recorded and will be processed manually.",
    });
  } catch (err: any) {
    console.error("Payout request error:", err);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", detail: err?.message || "unknown" },
      { status: 500 }
    );
  }
}
