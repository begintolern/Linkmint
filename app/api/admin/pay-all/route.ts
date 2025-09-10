// app/api/admin/pay-all/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";
import { sendPaypalPayout } from "@/lib/payments/sendPaypalPayout";
import { CommissionStatus } from "@prisma/client";

/**
 * POST /api/admin/pay-all[?dryRun=true][&limit=200]
 * - Finds all Approved & unpaid commissions
 * - If dryRun=true -> simulate, no writes
 * - Else -> sends sandbox payout (or live when enabled), marks Paid on success, logs event
 */
export async function POST(req: NextRequest) {
  const gate = await adminGuard();
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.reason }, { status: gate.status });
  }

  try {
    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dryRun") === "true";
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get("limit") || "200", 10) || 200, 1),
      1000
    );

    // pull Approved & unpaid commissions
    const rows = await prisma.commission.findMany({
      where: { status: CommissionStatus.APPROVED, paidOut: false },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: {
        id: true,
        userId: true,
        amount: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        paid: 0,
        totalAmount: 0,
        items: [],
        dryRun,
        message: "No approved/unpaid commissions found.",
      });
    }

    const items = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      email: r.user?.email ?? "",
      amount: Number(r.amount),
    }));
    const totalAmount = items.reduce((s, x) => s + x.amount, 0);

    if (dryRun) {
      return NextResponse.json({
        success: true,
        paid: 0,
        totalAmount,
        items,
        dryRun: true,
        message: `Would pay ${rows.length} commissions.`,
      });
    }

    let successCount = 0;
    for (const it of items) {
      // guard
      if (!it.email) {
        console.warn("Skipping commission without user email:", it.id);
        continue;
      }

      // send payout (sandbox by default)
      const res = await sendPaypalPayout({
        userId: it.userId,
        email: it.email,
        amount: it.amount,
        note: `Commission ${it.id}`,
      });

      if (res.success) {
        await prisma.$transaction([
          prisma.commission.update({
            where: { id: it.id },
            data: { status: CommissionStatus.PAID, paidOut: true },
          }),
          prisma.eventLog.create({
            data: {
              userId: it.userId,
              type: "payout",
              message: `Commission ${it.id} paid`,
              detail: `Amount ${it.amount}; txn=${res.id}`,
            },
          }),
        ]);
        successCount++;
      } else {
        // write a failure log but do not mark as paid
        await prisma.eventLog.create({
          data: {
            userId: it.userId,
            type: "payout_error",
            message: `Commission ${it.id} payout FAILED`,
            detail: res.error || "Unknown error",
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      paid: successCount,
      totalAmount,
      items,
      dryRun: false,
      message: `Processed ${rows.length} commissions; paid ${successCount}.`,
    });
  } catch (err) {
    console.error("POST /api/admin/pay-all error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
