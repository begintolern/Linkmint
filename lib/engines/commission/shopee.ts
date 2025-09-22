// lib/engines/commission/shopee.ts
// Self-contained calculator for Shopee PH percent commissions with cookie window & payout delay.

export type Money = { currency: string; amount: number }; // amount in minor units (e.g., cents)

export type ClickLike = {
  id: string;
  userId: string | null;
  merchantId: string | null;
  createdAt: Date | string;
  source?: string | null;
};

export type MerchantRuleLike = {
  id: string;
  merchantName: string;
  domainPattern?: string | null;
  market?: string | null;                   // may be undefined on older clients
  commissionType?: "PERCENT" | "CPS" | string | null;
  commissionRate?: string | number | null;  // allow string "0.05" or number 0.05 or 5
  cookieWindowDays?: number | null;         // default 7
  payoutDelayDays?: number | null;          // default 30
};

export type OrderLike = {
  orderId: string;
  orderAt: Date | string;
  // gross order value in minor units (e.g., centavos / cents)
  orderValue: Money;
  // optional currency override for payout
  payoutCurrency?: string;
  // whether the order later cancels/returns
  isCancelled?: boolean;
};

export type CommissionResult = {
  ok: boolean;
  reason?: string;
  clickId?: string;
  userId?: string | null;
  merchantId?: string | null;
  orderId?: string;
  // computed commission in minor units
  commission: Money | null;
  // meta for ledgers/holding logic
  holdUntil?: Date | null;
  cookieMatched?: boolean;
  appliedRate?: number | null; // normalized as fraction (e.g., 0.05 for 5%)
  notes?: string[];
};

function asDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}

/** Normalize commissionRate to a fraction (0.05 for 5%) */
function normalizeRate(rate: string | number | null | undefined): number | null {
  if (rate == null) return null;
  if (typeof rate === "number") {
    // If they provided 5 treat as 5%, if 0.05 treat as 5%
    return rate > 1 ? rate / 100 : rate;
  }
  const n = Number(rate);
  if (!isFinite(n)) return null;
  return n > 1 ? n / 100 : n;
}

/** Money helper */
function money(amount: number, currency: string): Money {
  return { amount: Math.round(amount), currency };
}

/**
 * Compute Shopee commission (PH default):
 * - percent-of-order
 * - cookie window enforced (default 7 days)
 * - payout delay hold (default 30 days)
 */
export function computeShopeeCommission(
  click: ClickLike,
  rule: MerchantRuleLike,
  order: OrderLike
): CommissionResult {
  const notes: string[] = [];

  // Basic merchant guard (don’t hard-fail; just note)
  const name = (rule.merchantName || "").toLowerCase();
  const host = (rule.domainPattern || "").toLowerCase();
  const looksShopee = name.includes("shopee") || host.includes("shopee.ph");
  if (!looksShopee) {
    notes.push("Rule does not look like Shopee; skipping special logic.");
  }

  const cookieDays = rule.cookieWindowDays ?? 7;
  const payoutDelayDays = rule.payoutDelayDays ?? 30;
  const orderAt = asDate(order.orderAt);
  const clickAt = asDate(click.createdAt);

  // Cookie match
  const cookieMs = cookieDays * 24 * 60 * 60 * 1000;
  const cookieMatched = orderAt.getTime() - clickAt.getTime() <= cookieMs && orderAt >= clickAt;

  if (!cookieMatched) {
    return {
      ok: false,
      reason: `Order outside cookie window (${cookieDays}d)`,
      clickId: click.id,
      userId: click.userId,
      merchantId: click.merchantId,
      orderId: order.orderId,
      commission: null,
      holdUntil: null,
      cookieMatched: false,
      appliedRate: null,
      notes,
    };
  }

  // Normalize rate
  const rate = normalizeRate(rule.commissionRate);
  if (rate == null || rate <= 0) {
    return {
      ok: false,
      reason: "Missing or zero commission rate",
      clickId: click.id,
      userId: click.userId,
      merchantId: click.merchantId,
      orderId: order.orderId,
      commission: null,
      holdUntil: null,
      cookieMatched: true,
      appliedRate: null,
      notes,
    };
  }

  // Compute commission in minor units
  const currency = order.payoutCurrency || order.orderValue.currency;
  const base = order.orderValue.amount; // already minor units
  const commissionAmount = base * rate;

  // Hold for payoutDelayDays unless cancelled
  const holdUntil =
    order.isCancelled
      ? null
      : new Date(orderAt.getTime() + payoutDelayDays * 24 * 60 * 60 * 1000);

  return {
    ok: true,
    clickId: click.id,
    userId: click.userId,
    merchantId: click.merchantId,
    orderId: order.orderId,
    commission: money(commissionAmount, currency),
    holdUntil,
    cookieMatched: true,
    appliedRate: rate,
    notes,
  };
}
