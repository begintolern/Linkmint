// app/api/debug/process-webhooks/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/debug/process-webhooks?limit=20
 * - Scans recent WEBHOOK_INCOMING logs
 * - Parses detail JSON, extracts subid -> SmartLink -> user
 * - Creates Commission rows using discovered enum values from an existing row
 * - If no enum example is available, stage the event and return reason
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const take = clampInt(url.searchParams.get("limit"), 1, 100, 20);

    // Discover enum values from any existing commission row
    const enumSample = await prisma.commission.findFirst({
      select: { type: true, status: true },
    }).catch(() => null as any);

    const discoveredType  = enumSample?.type  ?? null; // e.g., "SALE" | "STANDARD" | etc (from your schema)
    const discoveredStatus = enumSample?.status ?? null; // e.g., "PENDING" | etc

    // 1) Load recent incoming webhook logs
    const logs = await prisma.eventLog.findMany({
      where: { type: "WEBHOOK_INCOMING" },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, message: true, detail: true, createdAt: true },
    });

    const results: Array<{
      eventId: string;
      ok: boolean;
      reason?: string;
      commissionId?: string;
      typeUsed?: string | null;
      statusUsed?: string | null;
    }> = [];

    for (const log of logs) {
      const eventId = log.message || "";

      try {
        // 2) Skip if already processed
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
        const rawAmount = typeof payload?.amount === "number" ? payload.amount : Number(payload?.amount);
        if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
          results.push({ eventId, ok: false, reason: "invalid_amount" });
          continue;
        }

        // Many schemas store integers; round to be safe
        const amount = Math.round(rawAmount);

        const currency = (payload?.currency as string) || "PHP";
        const merchant =
          (payload?.merchant as string) ||
          smart.merchantName ||
          smart.merchantDomain ||
          "Unknown Merchant";
        const network = (payload?.network as string) || "Involve Asia";
        const txnId = (payload?.transaction_id as string) || null;

        // 6) Ensure we have enum values; if not, stage the record and skip
        if (!discoveredType || !discoveredStatus) {
          await prisma.eventLog.create({
            data: {
              type: "WEBHOOK_STAGED",
              message: eventId,
              detail: JSON.stringify({
                note: "No enum sample found; commission not created",
                subid,
                amount,
                currency,
                merchant,
                network,
                txnId,
              }),
            },
          });
          results.push({
            eventId,
            ok: false,
            reason: "unknown_enum_values",
            typeUsed: discoveredType,
            statusUsed: discoveredStatus,
          });
          continue;
        }

        // 7) Create Commission using discovered enum values
        const commission = await prisma.commission.create({
          data: {
            userId: smart.userId,
            amount: amount,
            type: discoveredType as any,   // enum value from your DB
            status: discoveredStatus as any, // enum value from your DB
            paidOut: false,
            source: `webhook:${network}`,
            description: txnId
              ? `Webhook ${network} ${merchant} ${currency} ${rawAmount} (txn ${txnId})`
              : `Webhook ${network} ${merchant} ${currency} ${rawAmount}`,
            ...(smart.merchantRuleId ? { merchantRuleId: smart.merchantRuleId } : {}),
          },
          select: { id: true },
        });

        // 8) Mark processed
        await prisma.eventLog.create({
          data: {
            type: "WEBHOOK_PROCESSED",
            message: eventId,
            detail: JSON.stringify({ subid, commissionId: commission.id }),
          },
        });

        results.push({
          eventId,
          ok: true,
          commissionId: commission.id,
          typeUsed: discoveredType,
          statusUsed: discoveredStatus,
        });
      } catch (e: any) {
        results.push({
          eventId: log.message || "",
          ok: false,
          reason: `exception:${safeErr(e)}`,
        });
      }
    }

    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "PROCESSOR_FAILED", message: safeErr(e) },
      { status: 200 }
    );
  }
}

function clampInt(v: string | null, min: number, max: number, fallback: number) {
  const n = v == null ? NaN : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function safeErr(e: any) {
  return e?.message || String(e);
}
