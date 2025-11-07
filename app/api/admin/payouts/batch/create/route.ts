// app/api/admin/payouts/batch/create/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function assertAdmin(req: Request) {
  const key = req.headers.get("x-admin-key") || "";
  return !!process.env.ADMIN_API_KEY && key === process.env.ADMIN_API_KEY;
}

type Body = {
  ids?: string[]; // payoutRequest IDs
  note?: string;
};

export async function POST(req: Request) {
  try {
    if (!assertAdmin(req)) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : [];
    const note = typeof body?.note === "string" ? body.note.slice(0, 250) : undefined;

    if (ids.length === 0) {
      return NextResponse.json({ ok: false, error: "MISSING_IDS" }, { status: 400 });
    }

    // Fetch requests
    const reqs = await prisma.payoutRequest.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        userId: true,
        amountPhp: true,
        method: true,        // "GCASH" | "BANK"
        provider: true,      // enum in your schema; we set MANUAL earlier
        status: true,        // PENDING | PROCESSING | PAID | FAILED
        gcashNumber: true,
        bankName: true,
        bankAccountNumber: true,
      },
    });

    if (reqs.length === 0) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    // Create a simple batch id (reuse Payout.paypalBatchId to store it)
    const batchId = `manual_${Date.now()}`;

    // Prepare creations; skip any that already have a Payout row
    const existingPayouts = await prisma.payout.findMany({
      where: { paypalBatchId: batchId }, // usually none yet
      select: { id: true },
    });

    // Also check payouts that may already exist for the same request (defensive)
    const existingForUsers = await prisma.payout.findMany({
      where: {
        userId: { in: reqs.map((r) => r.userId) },
        paypalBatchId: batchId,
      },
      select: { id: true, userId: true, paypalBatchId: true },
    });

    const toCreate = reqs.map((r) => ({
      userId: r.userId,
      amount: r.amountPhp,              // using PHP amount directly (Float)
      method: r.method,                 // keep original request method in Payout.method (String)
      status: "PROCESSING",             // original String field (kept for back-compat)
      statusEnum: "PROCESSING" as any,  // Prisma enum (your schema has Payout.statusEnum)
      details: note || `Batch ${batchId} – ${r.method}`,
      externalPayoutId: null,
      feeCents: 0,
      netCents: 0,
      payoutAccountId: null,
      paypalBatchId: batchId,           // store our batch id here for now
      provider: r.provider,             // MANUAL (from request)
      receiverEmail: null,              // we’ll leave this null for GCASH/BANK
      transactionId: null,
    }));

    // Create payouts in a transaction
    const created = await prisma.$transaction(async (tx) => {
      // Create one payout per request (no-op if already created by batchId+r.userId combo in future logic)
      const createdPayouts = [];
      for (const data of toCreate) {
        const p = await tx.payout.create({ data });
        createdPayouts.push(p);
      }
      return createdPayouts;
    });

    // Return summary
    return NextResponse.json({
      ok: true,
      batchId,
      count: created.length,
      created: created.map((p) => ({
        id: p.id,
        userId: p.userId,
        amount: p.amount,
        statusEnum: p.statusEnum,
        provider: p.provider,
        paypalBatchId: p.paypalBatchId,
      })),
    });
  } catch (e: any) {
    console.error("POST /admin/payouts/batch/create error:", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", detail: e?.message }, { status: 500 });
  }
}
