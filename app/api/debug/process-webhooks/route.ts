// app/api/debug/process-webhooks/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/debug/process-webhooks?limit=20
 * - Scans recent WEBHOOK_INCOMING logs
 * - For each, parses detail JSON, maps subid -> SmartLink -> user
 * - Creates PENDING Commission rows
 * - Writes a WEBHOOK_PROCESSED log to prevent duplicates
 *
 * Safe to run multiple times; already-processed event_ids are skipped.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const take = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") || 20)));

  // 1) Load recent incoming webhook logs
  const logs = await prisma.eventLog.findMany({
    where: { type: "WEBHOOK_INCOMING" },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, message: true, detail: true, createdAt: true },
  });

  const results: Array<{ eventId: string; ok: boolean; reason?: string; commissionId?: string }> = [];

  for (const log of logs) {
    const eventId = log.message || "";

    // 2) Check if already processed
    const processed = await prisma.eventLog.findFirst({
      where: { type: "WEBHOOK_PROCESSED", message: eventId },
      select: { id: true },
    });
    if (processed) {
      results.push({ eventId, ok: true, reason: "already_processed" });
      continue;
    }

    // 3) Parse detail
    let payload: any = null;
    try {
      payload = JSON.parse(log.detail || "{}");
    } catch {
      results.push({ eventId, ok: false, reason: "invalid_json_detail" });
      continue;
    }

    const subid: string | undefined = payload?.subid || payload?.lm_subid;
    if (!subid || typeof subid !== "string") {
      results.push({ eventId, ok: false, reason: "missing_subid" });
      continue;
    }

    // 4) Resolve SmartLink → user/merchant
    const smart = await prisma.smartLink.findUnique({
      where: { id: subid },
      select: {
        id: true,
        userId: true,
        merchantRuleId: true,
        merchantName: true,
        merchantDomain: true,
      },
    });

    if (!smart || !smart.userId) {
      results.push({ eventId, ok: false, reason: "smartlink_not_found_or_no_user" });
      continue;
    }

    // 5) Amount / currency / merchant from payload
    // NOTE: Your Commission.amount is likely numeric in your base currency units (e.g., PHP as major units).
    const amount = typeof payload?.amount === "number" ? payload.amount : Number(payload?.amount);
    const currency = (payload?.currency as string) || "PHP";
    const merchant = (payload?.merchant as string) || smart.merchantName || smart.merchantDomain || "Unknown Merchant";
    const network = (payload?.network as string) || "Involve Asia";
    const txnId = (payload?.transaction_id as string) || null;

    if (!Number.isFinite(amount) || amount <= 0) {
      results.push({ eventId, ok: false, reason: "invalid_amount" });
      continue;
    }

    // 6) Create Commission (PENDING)
    // Adjust enum values if your schema uses different names
    // Commission fields we assume exist: userId, amount, type, status, source, description, merchantRuleId (nullable)
    const commission = await prisma.commission.create({
      data: {
        userId: smart.userId,
        amount: amount, // store as major units; convert if your schema expects cents
        type: "SALE" as any,     // if your enum differs, update accordingly
        status: "PENDING" as any,
        paidOut: false,
        source: `webhook:${network}`,
        description: txnId
          ? `Webhook ${network} ${merchant} ${currency} ${amount} (txn ${txnId})`
          : `Webhook ${network} ${merchant} ${currency} ${amount}`,
        merchantRuleId: smart.merchantRuleId ?? undefined,
      },
      select: { id: true },
    });

    // 7) Mark processed
    await prisma.eventLog.create({
      data: {
        type: "WEBHOOK_PROCESSED",
        message: eventId,
        detail: JSON.stringify({ subid, commissionId: commission.id }),
      },
    });

    results.push({ eventId, ok: true, commissionId: commission.id });
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
