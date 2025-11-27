// app/api/admin/payouts/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";
import { sendPaypalPayout } from "@/lib/payments/sendPaypalPayout";
import { CommissionStatus } from "@prisma/client";

type PayBody =
  | { ids: string[]; early?: boolean } // explicit list
  | { userId: string; early?: boolean } // pay all for a user
  | { allApproved?: boolean; limit?: number; early?: boolean }; // pay all approved (optional limit)

type Row = {
  id: string;
  userId: string;
  amount: number | string;
  user?: { email: string | null } | null;
};

type Target = { id: string; userId: string; amount: number };

// Founder override list – add more emails later if needed
const FOUNDER_EMAILS = ["ertorig3@gmail.com", "fluterby_25@yahoo.com"];

const FLOAT_KEY = "FLOAT_BALANCE"; // PHP float balance

export async function POST(req: NextRequest) {
  const gate = await adminGuard();
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.reason }, { status: gate.status });
  }

  const body = (await req.json().catch(() => ({}))) as PayBody;
  const isEarly = (body as any)?.early === true; // TrustScore/float gate only applies when early=true

  // 1) Collect targets to pay
  let targets: Target[] = [];

  if ("ids" in body && Array.isArray(body.ids) && body.ids.length > 0) {
    const rows: Row[] = await prisma.commission.findMany({
      where: { id: { in: body.ids }, status: "APPROVED", paidOut: false },
      select: { id: true, userId: true, amount: true },
    });
    targets = rows
      .filter((r) => r && r.id)
      .map(
        (r: Row): Target => ({
          id: r.id,
          userId: r.userId,
          amount: Number(r.amount),
        }),
      );
  } else if ("userId" in body && body.userId) {
    const rows: Row[] = await prisma.commission.findMany({
      where: { userId: body.userId, status: "APPROVED", paidOut: false },
      select: { id: true, userId: true, amount: true },
    });
    targets = rows
      .filter((r) => r && r.id)
      .map(
        (r: Row): Target => ({
          id: r.id,
          userId: r.userId,
          amount: Number(r.amount),
        }),
      );
  } else {
    const limit = Math.min(Math.max((body as any)?.limit ?? 200, 1), 1000);
    const rows: Row[] = await prisma.commission.findMany({
      where: { status: "APPROVED", paidOut: false },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: { id: true, userId: true, amount: true, user: { select: { email: true } } },
    });
    targets = rows
      .filter((r: Row) => !!r.user?.email)
      .map(
        (r: Row): Target => ({
          id: r.id,
          userId: r.userId,
          amount: Number(r.amount),
        }),
      );
  }

  // Double-payout protection (already-paid hard block)
  for (const t of targets) {
    const commission = await prisma.commission.findUnique({
      where: { id: t.id },
      select: { paidOut: true, status: true },
    });

    if (!commission) {
      return NextResponse.json(
        { success: false, error: `Commission ${t.id} not found.` },
        { status: 400 },
      );
    }

    if (commission.paidOut === true || commission.status === CommissionStatus.PAID) {
      return NextResponse.json(
        { success: false, error: `Commission ${t.id} has already been paid.` },
        { status: 400 },
      );
    }
  }

  if (targets.length === 0) {
    return NextResponse.json({ success: true, paid: 0, items: [], message: "Nothing to pay." });
  }

  // 1.b) Float guard – batch-level check for EARLY payouts only
  if (isEarly) {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: FLOAT_KEY },
    });

    // default 5000 PHP if not set yet
    const currentFloat = setting && setting.value ? parseFloat(setting.value) : 5000;
    const totalRequested = targets.reduce((sum, t) => sum + t.amount, 0);

    if (totalRequested > currentFloat) {
      return NextResponse.json(
        {
          success: false,
          error: `Not enough float. Requested ${totalRequested.toFixed(
            2,
          )} PHP, available ${currentFloat.toFixed(2)} PHP.`,
        },
        { status: 400 },
      );
    }
  }

  // 2) Execute payouts & mark as PAID
  let paid = 0;

  for (const t of targets) {
    const user = await prisma.user.findUnique({
      where: { id: t.userId },
      select: { email: true, trustScore: true, createdAt: true },
    });

    if (!user?.email) {
      await prisma.eventLog.create({
        data: {
          userId: t.userId,
          type: "payout_error",
          message: `Missing email for ${t.userId}`,
          detail: t.id,
        },
      });
      continue;
    }

    const emailLower = user.email.toLowerCase();
    const isFounder = FOUNDER_EMAILS.includes(emailLower);

    // TrustScore gate for EARLY payouts only, founders bypass but still respect float
    if (isEarly && !isFounder) {
      const MIN_TRUST_SCORE = 50;
      const MIN_ACCOUNT_AGE_DAYS = 30;

      const ageMs = Date.now() - user.createdAt.getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);

      if (user.trustScore < MIN_TRUST_SCORE || ageDays < MIN_ACCOUNT_AGE_DAYS) {
        await prisma.eventLog.create({
          data: {
            userId: t.userId,
            type: "payout_blocked",
            message: `Early payout blocked by TrustScore/age for commission ${t.id}`,
            detail: `trustScore=${user.trustScore}; ageDays=${ageDays.toFixed(1)}`,
          },
        });
        continue;
      }
    }

    const res = await sendPaypalPayout({
      userId: t.userId,
      email: user.email,
      amount: t.amount,
      note: `Commission ${t.id}`,
    });

    if (res.success) {
      try {
        await prisma.$transaction(async (tx) => {
          // Per-payout float decrement for EARLY payouts
          if (isEarly) {
            const setting = await tx.systemSetting.findUnique({
              where: { key: FLOAT_KEY },
            });

            const currentFloat = setting && setting.value ? parseFloat(setting.value) : 5000;

            if (currentFloat < t.amount) {
              throw new Error(
                `Insufficient float for payout of ${t.amount.toFixed(
                  2,
                )} PHP. Current float: ${currentFloat.toFixed(2)} PHP.`,
              );
            }

            const newFloat = currentFloat - t.amount;

            await tx.systemSetting.upsert({
              where: { key: FLOAT_KEY },
              update: { value: newFloat.toString() },
              create: { key: FLOAT_KEY, value: newFloat.toString() },
            });
          }

          await tx.commission.update({
            where: { id: t.id },
            data: { status: "PAID", paidOut: true },
          });

          await tx.eventLog.create({
            data: {
              userId: t.userId,
              type: "payout",
              message: `Commission ${t.id} paid`,
              detail: `Amount ${t.amount}; txn=${res.id}`,
            },
          });
        });

        paid++;
      } catch (err: any) {
        await prisma.eventLog.create({
          data: {
            userId: t.userId,
            type: "payout_error",
            message: `Payout float/commit FAILED for ${t.id}`,
            detail: err?.message || "Unknown error",
          },
        });
      }
    } else {
      await prisma.eventLog.create({
        data: {
          userId: t.userId,
          type: "payout_error",
          message: `Payout FAILED for ${t.id}`,
          detail: res.error || "Unknown error",
        },
      });
    }
  }

  return NextResponse.json({ success: true, paid, items: targets });
}
