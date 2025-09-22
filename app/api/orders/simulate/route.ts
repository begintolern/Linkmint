// app/api/orders/simulate/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import recordCommission from "@/lib/engines/recordCommission.wrap";

/**
 * POST /api/orders/simulate
 * Body:
 * {
 *   clickId: string,
 *   orderId: string,
 *   orderAt: string,                      // ISO timestamp
 *   orderValueMinor: number,              // minor units (e.g., 100000 = ₱1,000.00)
 *   currency: string,                     // e.g., "PHP"
 *   isCancelled?: boolean
 * }
 *
 * Loads the click + its merchant rule from DB, then runs recordCommissionSafe().
 * This shows exactly what your live order ingestion will do, without touching legacy paths.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

    const clickId = String(body?.clickId || "").trim();
    const orderId = String(body?.orderId || "").trim();
    const orderAt = String(body?.orderAt || "").trim();
    const orderValueMinor = Number(body?.orderValueMinor);
    const currency = String(body?.currency || "").trim();
    const isCancelled = Boolean(body?.isCancelled ?? false);

    if (!clickId || !orderId || !orderAt || !isFinite(orderValueMinor) || !currency) {
      return NextResponse.json(
        { ok: false, message: "Missing/invalid fields. Required: clickId, orderId, orderAt, orderValueMinor, currency." },
        { status: 400 }
      );
    }

    // Load click
    const click = await prisma.clickEvent.findUnique({
      where: { id: clickId },
      select: {
        id: true,
        userId: true,
        merchantId: true,
        createdAt: true,
        source: true as any,
      },
    });

    if (!click) {
      return NextResponse.json({ ok: false, message: "Click not found." }, { status: 404 });
    }
    if (!click.merchantId) {
      return NextResponse.json({ ok: false, message: "Click has no merchantId." }, { status: 400 });
    }

    // Load merchant rule
    const rule = await prisma.merchantRule.findUnique({
      where: { id: click.merchantId },
      select: {
        id: true,
        merchantName: true,
        domainPattern: true,
        // tolerate schema drift by casting to any
        commissionType: true as any,
        commissionRate: true as any,
        cookieWindowDays: true as any,
        payoutDelayDays: true as any,
        market: true as any,
      },
    });

    if (!rule) {
      return NextResponse.json({ ok: false, message: "MerchantRule not found." }, { status: 404 });
    }

    // Run the safe wrapper (routes to Shopee engine if applicable)
    const result = await recordCommission({
      click: {
        id: click.id,
        userId: click.userId,
        merchantId: click.merchantId,
        createdAt: click.createdAt,
        source: (click as any).source ?? null,
      },
      rule: {
        id: rule.id,
        merchantName: rule.merchantName,
        domainPattern: rule.domainPattern,
        commissionType: (rule as any).commissionType,
        commissionRate: (rule as any).commissionRate,
        cookieWindowDays: (rule as any).cookieWindowDays,
        payoutDelayDays: (rule as any).payoutDelayDays,
        market: (rule as any).market,
      },
      order: {
        orderId,
        orderAt,
        orderValue: { amount: orderValueMinor, currency },
        payoutCurrency: currency,
        isCancelled,
      },
    });

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("orders/simulate error:", err);
    return NextResponse.json({ ok: false, message: "Simulation failed." }, { status: 500 });
  }
}
