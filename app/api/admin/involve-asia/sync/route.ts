// app/api/admin/involve-asia/sync/route.ts
/**
 * Involve Asia Sync v2
 *
 * - Admin-only route
 * - Accepts IA transactions as JSON
 * - Matches sub_id -> SmartLink -> user
 * - Creates payout records for matched rows (pending/approved)
 *
 * NOTE:
 * - This is a first-pass importer.
 * - It may create duplicates if you send the same IA row multiple times.
 *   For now, only run once per new batch while we refine.
 */

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

const ADMIN_USER_ID = "cmfbyhwog0000qi42l55ut0wi";

type IaRawRow = {
  sub_id?: string | null;
  lm_subid?: string | null;
  subId?: string | null;
  lmSubId?: string | null;
  status?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  order_id?: string | null;
  merchant_name?: string | null;
  network?: string | null;
  [key: string]: unknown;
};

type NormalizedIaRow = {
  subId: string;
  status: string;
  amount: number;
  currency: string;
  orderId: string | null;
  merchantName: string | null;
  network: string | null;
  raw: IaRawRow;
};

type MatchResult = {
  ia: NormalizedIaRow;
  smartLinkId: string | null;
  userId: string | null;
  merchantRuleId: string | null;
  merchantName: string | null;
};

function normalizeIaRow(row: IaRawRow): NormalizedIaRow | null {
  const subId =
    row.sub_id ||
    row.lm_subid ||
    row.subId ||
    row.lmSubId ||
    null;

  if (!subId || typeof subId !== "string" || !subId.trim()) {
    return null;
  }

  const status = String(row.status ?? "").trim().toUpperCase() || "PENDING";

  let amountNum = 0;
  if (typeof row.amount === "number") {
    amountNum = row.amount;
  } else if (typeof row.amount === "string") {
    const parsed = parseFloat(row.amount);
    if (!Number.isNaN(parsed)) amountNum = parsed;
  }

  const currency = String(row.currency ?? "PHP").trim().toUpperCase();
  const orderId =
    typeof row.order_id === "string" ? row.order_id : null;
  const merchantName =
    typeof row.merchant_name === "string" ? row.merchant_name : null;
  const network =
    typeof row.network === "string" ? row.network : null;

  return {
    subId: subId.trim(),
    status,
    amount: amountNum,
    currency,
    orderId,
    merchantName,
    network,
    raw: row,
  };
}

export async function POST(req: NextRequest) {
  // Auth guard
  const rawSession = (await getServerSession(authOptions)) as Session | null;
  const userId = (rawSession?.user as any)?.id as string | undefined;

  if (!userId || userId !== ADMIN_USER_ID) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const rows = (body as any)?.rows as IaRawRow[] | undefined;
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Missing or empty 'rows' array" },
      { status: 400 }
    );
  }

  const normalized: NormalizedIaRow[] = [];
  const invalid: IaRawRow[] = [];

  for (const r of rows) {
    const n = normalizeIaRow(r);
    if (n) normalized.push(n);
    else invalid.push(r);
  }

  const results: MatchResult[] = [];

  // Match each IA row to SmartLink + user
  for (const ia of normalized) {
    try {
      const smartLink = await prisma.smartLink.findUnique({
        where: { id: ia.subId },
        select: {
          id: true,
          userId: true,
          merchantRuleId: true,
          merchantName: true,
        },
      });

      if (!smartLink) {
        results.push({
          ia,
          smartLinkId: null,
          userId: null,
          merchantRuleId: null,
          merchantName: null,
        });
      } else {
        results.push({
          ia,
          smartLinkId: smartLink.id,
          userId: smartLink.userId,
          merchantRuleId: smartLink.merchantRuleId,
          merchantName: smartLink.merchantName,
        });
      }
    } catch {
      results.push({
        ia,
        smartLinkId: null,
        userId: null,
        merchantRuleId: null,
        merchantName: null,
      });
    }
  }

  // --- Create payout records for matched rows ---
  const imported: Array<{
    payoutId: string;
    userId: string;
    smartLinkId: string | null;
    amount: number;
    payoutStatus: string;
    iaStatus: string;
    iaOrderId: string | null;
    iaSubId: string;
  }> = [];

  for (const r of results) {
    if (!r.userId) continue;
    if (!r.ia.amount || r.ia.amount <= 0) continue;

    const iaStatus = r.ia.status;
    const upper = iaStatus.toUpperCase();

    // Map IA status → payout.status
    let payoutStatus: "pending" | "approved";
    if (
      upper === "APPROVED" ||
      upper === "CONFIRMED" ||
      upper === "SUCCESS" ||
      upper === "VALID"
    ) {
      payoutStatus = "approved";
    } else {
      // default: treat everything else as pending (waiting on merchant/network)
      payoutStatus = "pending";
    }

    try {
      const payout = await prisma.payout.create({
        data: {
          userId: r.userId,
          amount: new Prisma.Decimal(r.ia.amount),
          status: payoutStatus,
          // If your schema has more fields (like smartLinkId, currency, source),
          // we can wire them in later once we see the model.
        } as any,
      });

      imported.push({
        payoutId: payout.id,
        userId: r.userId,
        smartLinkId: r.smartLinkId,
        amount: r.ia.amount,
        payoutStatus,
        iaStatus,
        iaOrderId: r.ia.orderId,
        iaSubId: r.ia.subId,
      });
    } catch (err) {
      // If a single row fails, skip it but keep going
      // You can inspect server logs for the detailed error.
      continue;
    }
  }

  return NextResponse.json(
    {
      ok: true,
      matchedCount: results.filter((r) => r.smartLinkId).length,
      totalRows: normalized.length,
      invalidRows: invalid.length,
      importedCount: imported.length,
      results,
      imported,
    },
    { status: 200 }
  );
}
