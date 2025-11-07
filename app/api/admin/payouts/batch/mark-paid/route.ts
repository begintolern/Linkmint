// app/api/admin/payouts/batch/mark-paid/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function assertAdmin(req: Request) {
  const key = req.headers.get("x-admin-key") || "";
  return !!process.env.ADMIN_API_KEY && key === process.env.ADMIN_API_KEY;
}

type Body = {
  batchId?: string;
  requestIds?: string[]; // payoutRequest IDs included in this batch
  note?: string;
};

export async function POST(req: Request) {
  try {
    if (!assertAdmin(req)) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const batchId = (body.batchId || "").trim();
    const requestIds = Array.isArray(body.requestIds) ? body.requestIds.filter(Boolean) : [];
    const note = typeof body.note === "string" ? body.note.slice(0, 250) : "Batch marked PAID";

    if (!batchId) {
      return NextResponse.json({ ok: false, error: "MISSING_BATCH_ID" }, { status: 400 });
    }
    if (requestIds.length === 0) {
      return NextResponse.json({ ok: false, error: "MISSING_REQUEST_IDS" }, { status: 400 });
    }

    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      // 1) Mark payouts in this batch as PAID
      const payoutsUpdated = await tx.payout.updateMany({
        where: { paypalBatchId: batchId },
        data: {
          status: "PAID",          // legacy string
          statusEnum: "PAID" as any,
          paidAt: now,
          transactionId: batchId,
        },
      });

      // 2) Mark payout requests as PAID
      const reqsUpdated = await tx.payoutRequest.updateMany({
        where: { id: { in: requestIds } },
        data: {
          status: "PAID",
          processedAt: now,
          processorNote: note,
        },
      });

      return { payoutsUpdated: payoutsUpdated.count, reqsUpdated: reqsUpdated.count };
    });

    return NextResponse.json({ ok: true, batchId, ...result, note });
  } catch (e: any) {
    console.error("POST /admin/payouts/batch/mark-paid error:", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", detail: e?.message }, { status: 500 });
  }
}
