// app/api/admin/payouts/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";
import { CommissionStatus } from "@prisma/client";
import {
  payApprovedCommissionsViaPaypal,
  type PayTarget,
} from "@/lib/engines/autoPayoutEngine";

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

export async function POST(req: NextRequest) {
  const gate = await adminGuard();
  if (!gate.ok) {
    return NextResponse.json(
      { success: false, error: gate.reason },
      { status: gate.status },
    );
  }

  const body = (await req.json().catch(() => ({}))) as PayBody;
  const isEarly = (body as any)?.early === true;

  // 1) Collect targets to pay
  let targets: PayTarget[] = [];

  if ("ids" in body && Array.isArray(body.ids) && body.ids.length > 0) {
    const rows: Row[] = await prisma.commission.findMany({
      where: { id: { in: body.ids }, status: "APPROVED", paidOut: false },
      select: { id: true, userId: true, amount: true },
    });
    targets = rows
      .filter((r) => r && r.id)
      .map((r: Row): PayTarget => ({
        id: r.id,
        userId: r.userId,
        amount: Number(r.amount),
      }));
  } else if ("userId" in body && body.userId) {
    const rows: Row[] = await prisma.commission.findMany({
      where: { userId: body.userId, status: "APPROVED", paidOut: false },
      select: { id: true, userId: true, amount: true },
    });
    targets = rows
      .filter((r) => r && r.id)
      .map((r: Row): PayTarget => ({
        id: r.id,
        userId: r.userId,
        amount: Number(r.amount),
      }));
  } else {
    const limit = Math.min(Math.max((body as any)?.limit ?? 200, 1), 1000);
    const rows: Row[] = await prisma.commission.findMany({
      where: { status: "APPROVED", paidOut: false },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: {
        id: true,
        userId: true,
        amount: true,
        user: { select: { email: true } },
      },
    });
    targets = rows
      .filter((r: Row) => !!r.user?.email)
      .map((r: Row): PayTarget => ({
        id: r.id,
        userId: r.userId,
        amount: Number(r.amount),
      }));
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
    return NextResponse.json({
      success: true,
      paid: 0,
      items: [],
      message: "Nothing to pay.",
    });
  }

  // 2) Delegate to engine (handles float + founders + TrustScore + events)
  const result = await payApprovedCommissionsViaPaypal(targets, { early: isEarly });

  if (!result.success && result.error) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
        paid: result.paid,
        items: result.items,
      },
      { status: 400 },
    );
  }

  return NextResponse.json(result);
}
