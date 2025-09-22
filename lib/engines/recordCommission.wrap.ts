// lib/engines/recordCommission.wrap.ts
import { routeCommission } from "./recordCommissionRouter";
import originalRecordCommission from "./recordCommission"; // your current engine

type MinorMoney = { amount: number; currency: string };

export type RecordCommissionInput = {
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
    orderValue: MinorMoney; // minor units (centavos/cents)
    payoutCurrency?: string;
    isCancelled?: boolean;
  };
};

export type RecordCommissionResult = {
  ok: boolean;
  reason?: string;
  commission?: MinorMoney | null;
  holdUntil?: Date | string | null;
  engine?: "shopee" | "legacy" | "unknown";
  meta?: any;
};

function looksLikeShopee(rule: { merchantName?: string | null; domainPattern?: string | null }) {
  const name = (rule.merchantName || "").toLowerCase();
  const host = (rule.domainPattern || "").toLowerCase();
  return name.includes("shopee") || host.includes("shopee.ph");
}

function coerceLegacyCommission(obj: any): MinorMoney | null | undefined {
  if (!obj) return undefined;
  if (
    obj.commission &&
    typeof obj.commission.amount === "number" &&
    typeof obj.commission.currency === "string"
  ) {
    return obj.commission as MinorMoney;
  }
  if (typeof obj.commissionAmountMinor === "number" && typeof obj.currency === "string") {
    return { amount: obj.commissionAmountMinor, currency: obj.currency };
  }
  if (typeof obj.amountMinor === "number" && typeof obj.currency === "string") {
    return { amount: obj.amountMinor, currency: obj.currency };
  }
  if (typeof obj.amount === "number" && typeof obj.currency === "string") {
    return { amount: obj.amount, currency: obj.currency };
  }
  return undefined;
}

function coerceLegacyOk(obj: any): boolean {
  if (!obj) return false;
  if (typeof obj.ok === "boolean") return obj.ok;
  return true; // treat legacy success objects as ok
}

export default async function recordCommissionSafe(
  input: RecordCommissionInput
): Promise<RecordCommissionResult> {
  try {
    if (looksLikeShopee(input.rule)) {
      const res = routeCommission(input);
      if (res.ok) {
        return {
          ok: true,
          commission: res.commission ?? null,
          holdUntil: (res.holdUntil as any) ?? null,
          engine: "shopee",
          meta: {
            cookieMatched: res.cookieMatched,
            appliedRate: res.appliedRate,
            notes: res.notes,
          },
        };
      }
      return {
        ok: false,
        reason: res.reason || "Shopee commission not applicable",
        engine: "shopee",
        meta: { notes: res.notes },
      };
    }

    const legacy: any = await (originalRecordCommission as any)(input as any);
    const ok = coerceLegacyOk(legacy);
    const commission = coerceLegacyCommission(legacy);
    const holdUntil =
      legacy?.holdUntil ?? legacy?.payoutAt ?? legacy?.releaseAt ?? null;

    return {
      ok,
      commission: commission ?? null,
      holdUntil,
      engine: "legacy",
      meta: legacy,
    };
  } catch (err: any) {
    return {
      ok: false,
      reason: err?.message || "recordCommissionSafe error",
      engine: "unknown",
    };
  }
}
