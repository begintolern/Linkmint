// app/api/admin/payouts/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";
import { sendPaypalPayout } from "@/lib/payments/sendPaypalPayout";

type PayBody =
  | { ids: string[] } // explicit list
  | { userId: string } // pay all for a user
  | { allApproved?: boolean; limit?: number }; // pay all approved (optional limit)

type Row = {
  id: string;
  userId: string;
  amount: number | string;
  user?: { email: string | null } | null;
};

type Target = { id: string; userId: string; amount: number };

export async function POST(req: NextRequest) {
  const gate = await adminGuard();
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.reason }, { status: gate.status });
  }

  const body = (await req.json().catch(() => ({}))) as PayBody;

  // 1) Collect targets to pay
  let targets: Target[] = [];

  if ("ids" in body && Array.isArray(body.ids) && body.ids.length > 0) {
    const rows: Row[] = await prisma.commission.findMany({
      where: { id: { in: body.ids }, status: "APPROVED", paidOut: false },
      select: { id: true, userId: true, amount: true },
    });
    targets = rows.map(
      (r: Row): Target => ({ id: r.id, userId: r.userId, amount: Number(r.amount) })
    );
  } else if ("userId" in body && body.userId) {
    const rows: Row[] = await prisma.commission.findMany({
      where: { userId: body.userId, status: "APPROVED", paidOut: false },
      select: { id: true, userId: true, amount: true },
    });
    targets = rows.map(
      (r: Row): Target => ({ id: r.id, userId: r.userId, amount: Number(r.amount) })
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
      .map((r: Row): Target => ({ id: r.id, userId: r.userId, amount: Number(r.amount) }));
  }

  if (targets.length === 0) {
    return NextResponse.json({ success: true, paid: 0, items: [], message: "Nothing to pay." });
  }

  // 2) Execute payouts & mark as PAID
  let paid = 0;
  for (const t of targets) {
    const user = await prisma.user.findUnique({
      where: { id: t.userId },
      select: { email: true },
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

    const res = await sendPaypalPayout({
      userId: t.userId,
      email: user.email,
      amount: t.amount,
      note: `Commission ${t.id}`,
    });

    if (res.success) {
      await prisma.$transaction([
        prisma.commission.update({
          where: { id: t.id },
          data: { status: "PAID", paidOut: true },
        }),
        prisma.eventLog.create({
          data: {
            userId: t.userId,
            type: "payout",
            message: `Commission ${t.id} paid`,
            detail: `Amount ${t.amount}; txn=${res.id}`,
          },
        }),
      ]);
      paid++;
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
