// app/api/orders/simulate/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
 * Loads the click + merchant rule, computes a commission **locally** (no writes),
 * and returns the simulation result.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({} as any))) as {
      clickId?: string;
      orderId?: string;
      orderAt?: string;
      orderValueMinor?: number;
      currency?: string;
      isCancelled?: boolean;
    };

    const clickId = String(body?.clickId || "").trim();
    const orderId = String(body?.orderId || "").trim();
    const orderAt = String(body?.orderAt || "").trim();
    const orderValueMinor = Number(body?.orderValueMinor);
    const currency = String(body?.currency || "").trim();
    const isCancelled = Boolean(body?.isCancelled ?? false);

    if (!clickId || !orderId || !orderAt || !isFinite(orderValueMinor) || !currency) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Missing/invalid fields. Required: clickId, orderId, orderAt, orderValueMinor, currency.",
        },
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
        commissionType: true as any, // tolerate schema drift
        commissionRate: true as any,
        cookieWindowDays: true as any,
        payoutDelayDays: true as any,
        market: true as any,
      },
    });

    if (!rule) {
      return NextResponse.json({ ok: false, message: "MerchantRule not found." }, { status: 404 });
    }

    // --- Commission simulation (no DB writes) ---
    const orderValueMajor = Math.max(0, Math.round(orderValueMinor) / 100);
    const type = String((rule as any).commissionType ?? "PERCENT").toUpperCase();
    const rawRate = (rule as any).commissionRate;
    const rate = Number(rawRate);
    const safeRate = Number.isFinite(rate) ? rate : 0;

    // Simple strategy:
    // - PERCENT: amount = orderValueMajor * (rate / 100)
    // - FIXED:   amount = rate
    // Default to PERCENT behavior if unknown type
    let commissionAmount = 0;
    if (type === "FIXED") {
      commissionAmount = safeRate;
    } else {
      commissionAmount = orderValueMajor * (safeRate / 100);
    }

    // Round to 2 decimals for currency
    commissionAmount = Math.round(commissionAmount * 100) / 100;

    const result = {
      click: {
        id: click.id,
        userId: click.userId,
        merchantId: click.merchantId,
        createdAt: click.createdAt.toISOString(),
        source: (click as any).source ?? null,
      },
      rule: {
        id: rule.id,
        merchantName: rule.merchantName,
        domainPattern: rule.domainPattern,
        commissionType: type,
        commissionRate: safeRate,
        cookieWindowDays: (rule as any).cookieWindowDays ?? null,
        payoutDelayDays: (rule as any).payoutDelayDays ?? null,
        market: (rule as any).market ?? null,
      },
      order: {
        orderId,
        orderAt,
        valueMajor: orderValueMajor,
        valueMinor: Math.round(orderValueMinor),
        currency,
        isCancelled,
      },
      computation: {
        model: type === "FIXED" ? "FIXED" : "PERCENT",
        amount: commissionAmount,
        currency,
      },
    };

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("orders/simulate error:", err);
    return NextResponse.json({ ok: false, message: "Simulation failed." }, { status: 500 });
  }
}
