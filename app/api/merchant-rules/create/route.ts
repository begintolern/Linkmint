export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  Prisma,
  MerchantRule as DbMerchantRule,
  CommissionCalc,
  ImportMethod,
} from "@prisma/client";
import { logEvent } from "@/lib/compliance/log";

function serialize(m: DbMerchantRule) {
  return {
    ...m,
    commissionRate: m.commissionRate ? Number(m.commissionRate) : null,
    lastImportedAt: m.lastImportedAt ? m.lastImportedAt.toISOString() : null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    allowedSources: m.allowedSources ?? null,
    disallowed: m.disallowed ?? null,
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;

    // Required
    const merchantName = (body.merchantName ?? "").toString().trim();
    if (!merchantName) {
      return NextResponse.json(
        { ok: false, error: "merchantName_required" },
        { status: 400 }
      );
    }

    const created = await prisma.merchantRule.create({
      data: {
        merchantName,
        active: typeof body.active === "boolean" ? body.active : true,
        network: body.network ?? null,
        domainPattern: body.domainPattern ?? null,
        paramKey: body.paramKey ?? null,
        paramValue: body.paramValue ?? null,
        linkTemplate: body.linkTemplate ?? null,
        allowedSources:
          typeof body.allowedSources === "undefined"
            ? undefined
            : (body.allowedSources as Prisma.InputJsonValue),
        disallowed:
          typeof body.disallowed === "undefined"
            ? undefined
            : (body.disallowed as Prisma.InputJsonValue),
        cookieWindowDays:
          typeof body.cookieWindowDays === "number"
            ? body.cookieWindowDays
            : null,
        payoutDelayDays:
          typeof body.payoutDelayDays === "number"
            ? body.payoutDelayDays
            : null,
        commissionType:
          body.commissionType === "FIXED"
            ? CommissionCalc.FIXED
            : CommissionCalc.PERCENT,
        commissionRate:
          typeof body.commissionRate === "number"
            ? new Prisma.Decimal(body.commissionRate)
            : null,
        calc: body.calc ?? null,
        rate: typeof body.rate === "number" ? body.rate : null,
        notes: body.notes ?? null,
        importMethod:
          body.importMethod === "API" ? ImportMethod.API : ImportMethod.MANUAL,
        apiBaseUrl: body.apiBaseUrl ?? null,
        apiAuthType: body.apiAuthType ?? null,
        apiKeyRef: body.apiKeyRef ?? null,
        status: body.status ?? "PENDING",
        inactiveReason: body.inactiveReason ?? null,
        allowedRegions: Array.isArray(body.allowedRegions)
          ? body.allowedRegions
          : typeof body.allowedRegions === "string"
          ? body.allowedRegions.split(",").map((s: string) => s.trim())
          : [],
      },
    });

    // 🔒 Write a compliance audit trail entry (non-blocking)
    await logEvent({
      type: "MERCHANT_CREATED",
      severity: 1,
      message: `Merchant created: ${created.merchantName}`,
      merchantId: created.id,
      meta: {
        network: created.network,
        domainPattern: created.domainPattern,
        commissionType: created.commissionType,
        commissionRate: created.commissionRate ? Number(created.commissionRate) : null,
        allowedRegions: created.allowedRegions,
        status: created.status,
      },
    });

    return NextResponse.json({ ok: true, merchant: serialize(created) });
  } catch (err) {
    console.error("merchant-rules/create POST failed:", err);
    // Also try to log a compliance error (but don’t fail request twice)
    await logEvent({
      type: "MERCHANT_CREATE_ERROR",
      severity: 3,
      message: "Create merchant failed",
      meta: { error: String(err) },
    });
    return NextResponse.json(
      { ok: false, error: "CREATE_FAILED" },
      { status: 500 }
    );
  }
}
