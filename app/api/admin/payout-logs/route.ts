// app/api/admin/payout-logs/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";

export async function GET(req: NextRequest) {
  const gate = await adminGuard();
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.reason }, { status: gate.status });
  }

  try {
    const url = new URL(req.url);
    const take = Math.min(Math.max(Number(url.searchParams.get("take") || 50), 1), 200);
    const cursor = url.searchParams.get("cursor") || undefined;

    const logs = await prisma.payoutLog.findMany({
      take: take + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        status: true,
        receiverEmail: true,
        amount: true,
        paypalBatchId: true,
        transactionId: true,
        note: true,
        userId: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });

    let nextCursor: string | null = null;
    if (logs.length > take) {
      const nextItem = logs.pop()!;
      nextCursor = nextItem.id;
    }

    return NextResponse.json({ success: true, logs, nextCursor });
  } catch (err: any) {
    console.error("Admin payout-logs GET error:", err?.message || err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
