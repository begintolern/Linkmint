// app/api/admin/payouts/batch/get/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function assertAdmin(req: Request) {
  const key = req.headers.get("x-admin-key") || "";
  return !!process.env.ADMIN_API_KEY && key === process.env.ADMIN_API_KEY;
}

export async function GET(req: Request) {
  try {
    if (!assertAdmin(req)) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const url = new URL(req.url);
    const batchId = (url.searchParams.get("batchId") || "").trim();
    if (!batchId) {
      return NextResponse.json({ ok: false, error: "MISSING_BATCH_ID" }, { status: 400 });
    }

    const payouts = await prisma.payout.findMany({
      where: { paypalBatchId: batchId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        userId: true,
        amount: true,
        statusEnum: true,
        provider: true,
        paypalBatchId: true,
        transactionId: true,
        paidAt: true,
      },
    });

    const total = payouts.length;
    const paid = payouts.filter(p => p.statusEnum === "PAID").length;
    const sum = payouts.reduce((a, p) => a + (Number(p.amount) || 0), 0);

    return NextResponse.json({
      ok: true,
      batchId,
      total,
      paid,
      sumAmount: sum,
      payouts,
    });
  } catch (e: any) {
    console.error("GET /admin/payouts/batch/get error:", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", detail: e?.message }, { status: 500 });
  }
}
