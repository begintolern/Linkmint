// lib/merchants/registry.ts

export type MerchantKey = "SHOPEE_PH" | "LAZADA_PH";

export type MerchantDef = {
  key: MerchantKey;
  label: string;
  country: "PH";
  // env var names required for live mode
  requiredEnv: string[];
  // docs link or note (optional)
  note?: string;
};

export const MERCHANTS: MerchantDef[] = [
  {
    key: "SHOPEE_PH",
    label: "Shopee PH",
    country: "PH",
    // adjust names later if your provider uses different ones
    requiredEnv: ["SHOPEE_PARTNER_ID", "SHOPEE_PARTNER_KEY", "SHOPEE_SHOP_ID"],
    note: "Provisioned only. Live access requires partner keys.",
  },
  {
    key: "LAZADA_PH",
    label: "Lazada PH",
    country: "PH",
    requiredEnv: ["LAZADA_APP_KEY", "LAZADA_APP_SECRET"],
    note: "Provisioned only. Live access requires app credentials.",
  },
];

export function getEnv(key: string) {
  // centralize for easier mocking/tests later
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
