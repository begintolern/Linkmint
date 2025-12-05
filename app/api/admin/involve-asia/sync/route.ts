// app/api/admin/involve-asia/sync/route.ts
/**
 * Involve Asia Sync v2 (debug)
 *
 * - Admin-only / secret-only route
 * - Accepts IA transactions as JSON
 * - Matches sub_id -> SmartLink -> user
 * - Creates commission records for matched rows
 */

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { CommissionType, CommissionStatus } from "@prisma/client";

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
  // ---- AUTH GUARD: admin session OR shared secret ----
  const secretHeader =
    req.headers.get("x-ia-secret") || req.headers.get("X-IA-Secret");
  const expectedSecret = process.env.INVOLVE_ASIA_WEBHOOK_SECRET;

  const rawSession = (await getServerSession(authOptions)) as Session | null;
  const sessionUserId = (rawSession?.user as any)?.id as string | undefined;

  const hasValidSession = !!sessionUserId && sessionUserId === ADMIN_USER_ID;
  const hasValidSecret =
    !!secretHeader &&
    !!expectedSecret &&
    secretHeader.trim() === expectedSecret.trim();

  if (!hasValidSession && !hasValidSecret) {
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

  const imported: any[] = [];
  const skipped: any[] = [];
  const errors: any[] = [];

  for (const r of results) {
    if (!r.userId) {
      skipped.push({
        subId: r.ia.subId,
        reason: "No userId / smartLink match",
      });
      continue;
    }

    if (!r.ia.amount || r.ia.amount <= 0) {
      skipped.push({
        subId: r.ia.subId,
        reason: `Non-positive amount: ${r.ia.amount}`,
      });
      continue;
    }

    const iaStatus = r.ia.status;
    const upper = iaStatus.toUpperCase();

    let commissionStatus: CommissionStatus;
    if (
      upper === "APPROVED" ||
      upper === "CONFIRMED" ||
      upper === "SUCCESS" ||
      upper === "VALID"
    ) {
      commissionStatus = CommissionStatus.APPROVED;
    } else {
      commissionStatus = CommissionStatus.PENDING;
    }

    const description = r.ia.orderId
      ? `${r.ia.merchantName ?? "Merchant"} · Order ${r.ia.orderId}`
      : `${r.ia.merchantName ?? "Merchant"} purchase`;

    try {
      const commission = await prisma.commission.create({
        data: {
          userId: r.userId,
          amount: r.ia.amount,
          status: commissionStatus,
          source: r.ia.network || "Involve Asia",
          description,
          type: CommissionType.referral_purchase,
        },
      });

      imported.push({
        commissionId: commission.id,
        userId: r.userId,
        smartLinkId: r.smartLinkId,
        amount: r.ia.amount,
        commissionStatus,
        iaStatus,
        iaOrderId: r.ia.orderId,
        iaSubId: r.ia.subId,
      });
    } catch (err: any) {
      console.error("IA sync create commission failed:", err);
      errors.push({
        subId: r.ia.subId,
        reason: "Prisma error creating commission",
        message: String(err?.message || err),
      });
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
      imported,
      skipped,
      errors,
    },
    { status: 200 }
  );
}
