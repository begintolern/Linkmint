// lib/engines/recordCommissionRouter.ts
// Routes a (click, merchant rule, order) triplet to the right calculator.
// Non-destructive: you can call this alongside your existing recordCommission.

import type { Prisma } from "@prisma/client";
import {
  computeShopeeCommission,
  type ClickLike,
  type MerchantRuleLike,
  type OrderLike,
  type CommissionResult,
} from "./commission/shopee";

/** Narrow Prisma types to the lite shapes our calculators consume */
function toClickLike(c: {
  id: string;
  userId: string | null;
  merchantId: string | null;
  createdAt: Date | string;
  source?: string | null;
}): ClickLike {
  return {
    id: c.id,
    userId: c.userId,
    merchantId: c.merchantId,
    createdAt: c.createdAt,
    source: c.source ?? null,
  };
}

function toRuleLike(r: {
  id: string;
  merchantName: string;
  domainPattern?: string | null;
  market?: string | null;
  commissionType?: string | null;
  commissionRate?: string | number | null;
  cookieWindowDays?: number | null;
  payoutDelayDays?: number | null;
}): MerchantRuleLike {
  return {
    id: r.id,
    merchantName: r.merchantName,
    domainPattern: r.domainPattern ?? null,
    market: (r as any).market ?? null, // tolerate older Prisma clients
    commissionType: (r as any).commissionType ?? null,
    commissionRate: (r as any).commissionRate ?? null,
    cookieWindowDays: (r as any).cookieWindowDays ?? null,
    payoutDelayDays: (r as any).payoutDelayDays ?? null,
  };
}

export type RouteInput = {
  click: {
    id: string;
    userId: string | null;
    merchantId: string | null;
    createdAt: Date | string;
    source?: string | null;
  };
  rule: {
    id: string;
    merchantName: string;
    domainPattern?: string | null;
    market?: string | null;
    commissionType?: string | null;
    commissionRate?: string | number | null;
    cookieWindowDays?: number | null;
    payoutDelayDays?: number | null;
  };
  order: {
    orderId: string;
    orderAt: Date | string;
    orderValue: { amount: number; currency: string }; // minor units
    payoutCurrency?: string;
    isCancelled?: boolean;
  };
};

/** Simple brand/router check (compile-safe, no reliance on schema enums) */
function looksLikeShopee(rule: { merchantName?: string | null; domainPattern?: string | null }) {
  const name = (rule.merchantName || "").toLowerCase();
  const host = (rule.domainPattern || "").toLowerCase();
  return name.includes("shopee") || host.includes("shopee.ph");
}

/**
 * Route to the correct commission engine.
 * Return shape matches CommissionResult for uniform handling.
 */
export function routeCommission(input: RouteInput): CommissionResult & {
  engine?: "shopee" | "unknown";
} {
  const ruleLite = toRuleLike(input.rule);
  const clickLite = toClickLike(input.click);
  const orderLite: OrderLike = {
    orderId: input.order.orderId,
    orderAt: input.order.orderAt,
    orderValue: input.order.orderValue,
    payoutCurrency: input.order.payoutCurrency,
    isCancelled: input.order.isCancelled,
  };

  if (looksLikeShopee(ruleLite)) {
    const res = computeShopeeCommission(clickLite, ruleLite, orderLite);
    return { ...res, engine: "shopee" };
  }

  // Fallback for merchants we haven’t implemented yet
  return {
    ok: false,
    reason: "No commission engine for this merchant.",
    clickId: clickLite.id,
    userId: clickLite.userId,
    merchantId: clickLite.merchantId,
    orderId: orderLite.orderId,
    commission: null,
    holdUntil: null,
    cookieMatched: false,
    appliedRate: null,
    notes: ["routeCommission: engine not found"],
    engine: "unknown",
  };
}
