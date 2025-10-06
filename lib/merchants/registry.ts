// lib/merchants/registry.ts

export type MerchantKey = "SHOPEE_PH" | "LAZADA_PH";

export type MerchantDef = {
  key: MerchantKey;
  label: string;
  country: "PH";
  requiredEnv: string[];
  note?: string;
  // simple domain matchers for identify endpoint
  domains: string[];
};

export const MERCHANTS: MerchantDef[] = [
  {
    key: "SHOPEE_PH",
    label: "Shopee PH",
    country: "PH",
    requiredEnv: ["SHOPEE_PARTNER_ID", "SHOPEE_PARTNER_KEY", "SHOPEE_SHOP_ID"],
    note: "Provisioned only. Live access requires partner keys.",
    domains: ["shopee.ph", "shopee.com", "shopee.sg"], // include common variants
  },
  {
    key: "LAZADA_PH",
    label: "Lazada PH",
    country: "PH",
    requiredEnv: ["LAZADA_APP_KEY", "LAZADA_APP_SECRET"],
    note: "Provisioned only. Live access requires app credentials.",
    domains: ["lazada.com.ph", "lazada.com"],
  },
];

export function getEnv(key: string) {
  return process.env[key];
}

export function merchantHealth() {
  return MERCHANTS.map((m) => {
    const missingEnv = m.requiredEnv.filter((e) => !getEnv(e));
    const ready = missingEnv.length === 0;
    return {
      key: m.key,
      label: m.label,
      country: m.country,
      ready,
      missingEnv,
      note: m.note ?? "",
      mode: ready ? "LIVE_READY" : "PROVISIONED",
    };
  });
}

/** Best-effort merchant detection from product/store URL. */
export function matchMerchantFromUrl(raw: string) {
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    const found = MERCHANTS.find((m) => m.domains.some((d) => host === d || host.endsWith(`.${d}`)));
    if (!found) return null;

    const missingEnv = found.requiredEnv.filter((e) => !getEnv(e));
    const ready = missingEnv.length === 0;

    return {
      key: found.key,
      label: found.label,
      country: found.country,
      ready,
      missingEnv,
      note: found.note ?? "",
      normalizedUrl: u.toString(),
      host,
    };
  } catch {
    return null;
  }
}
