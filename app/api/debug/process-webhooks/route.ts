// app/api/debug/process-webhooks/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Debug-only webhook processor.
 * Scans WEBHOOK_INCOMING logs, resolves SmartLink + user, and records commissions.
 * Writes legacy `amount` (Float) only — no amountMinor/currency columns in current schema.
 */
export async function POST() {
  try {
    // 1) Load recent webhook logs (process oldest first for determinism)
    const logs = await prisma.eventLog.findMany({
      where: { type: "WEBHOOK_INCOMING" },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const results: Array<{
      eventId: string | null;
      ok: boolean;
      reason?: string;
      commissionId?: string;
      typeUsed?: string;
      statusUsed?: string;
    }> = [];

    for (const log of logs) {
      // Parse payload
      let parsed: any;
      try {
        parsed = JSON.parse(log.detail ?? "{}");
      } catch {
        results.push({ eventId: log.message ?? null, ok: false, reason: "invalid_json" });
        continue;
      }

      const eventId: string | null = parsed?.event_id ?? log.message ?? null;
      const subid: string | undefined = parsed?.subid ?? parsed?.lm_subid;
      const rawAmount = parsed?.amount;
      const rawCurrency = parsed?.currency;
      const merchant = parsed?.merchant ?? "Unknown Merchant";
      const network = parsed?.network ?? "Involve Asia";
      const txnId = parsed?.transaction_id ?? null;

      if (!subid) {
        results.push({ eventId, ok: false, reason: "missing_subid" });
        continue;
      }

      // Resolve SmartLink
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

      // Normalize amount & currency (currency used only in description text)
      const numAmount = typeof rawAmount === "number" ? rawAmount : Number(rawAmount);
      if (!Number.isFinite(numAmount) || numAmount <= 0) {
        results.push({ eventId, ok: false, reason: "invalid_amount" });
        continue;
      }
      const currencyCode =
        typeof rawCurrency === "string" && rawCurrency.trim()
          ? rawCurrency.trim().toUpperCase()
          : "PHP";

      // Legacy amount (Float) for current schema
      const legacyAmount = Math.round(numAmount); // keep integer-ish legacy behavior

      // Discover enum values (fallback-safe)
      const model: any = prisma.commission;
      const discoveredType = model?._meta?.fields?.type?.values?.[0] ?? "referral_purchase";
      const discoveredStatus = model?._meta?.fields?.status?.values?.[0] ?? "PENDING";

      // Try to create commission as PENDING first; fallback to discovered status if enum mismatch
      let commissionId: string | null = null;
      try {
        const c = await prisma.commission.create({
          data: {
            userId: smart.userId,
            amount: legacyAmount, // Float in schema
            type: (discoveredType as any),
            status: ("PENDING" as any),
            paidOut: false,
            source: `webhook:${network}`,
            description: txnId
              ? `Webhook ${network} ${merchant} ${currencyCode} ${numAmount} (txn ${txnId})`
              : `Webhook ${network} ${merchant} ${currencyCode} ${numAmount}`,
            ...(smart.merchantRuleId ? { merchantRuleId: smart.merchantRuleId } : {}),
          },
          select: { id: true },
        });
        commissionId = c.id;
      } catch {
        const c = await prisma.commission.create({
          data: {
            userId: smart.userId,
            amount: legacyAmount,
            type: (discoveredType as any),
            status: (discoveredStatus as any),
            paidOut: false,
            source: `webhook:${network}`,
            description: txnId
              ? `Webhook ${network} ${merchant} ${currencyCode} ${numAmount} (txn ${txnId})`
              : `Webhook ${network} ${merchant} ${currencyCode} ${numAmount}`,
            ...(smart.merchantRuleId ? { merchantRuleId: smart.merchantRuleId } : {}),
          },
          select: { id: true },
        });
        commissionId = c.id;
      }

      // Mark processed (idempotency marker)
      await prisma.eventLog.create({
        data: {
          type: "WEBHOOK_PROCESSED",
          message: eventId ?? "",
          detail: JSON.stringify({ subid, commissionId }),
        },
      });

      results.push({
        eventId,
        ok: true,
        commissionId: commissionId ?? undefined,
        typeUsed: discoveredType,
        statusUsed: "PENDING-or-fallback",
      });
    }

    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "PROCESSOR_FAILED", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
