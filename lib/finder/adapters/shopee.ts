// lib/finder/adapters/shopee.ts
export function shopeeEnvReady() {
  return Boolean(
    process.env.SHOPEE_PARTNER_ID &&
      process.env.SHOPEE_PARTNER_KEY &&
      process.env.SHOPEE_SHOP_ID
  );
}

// Later: real implementation
export async function shopeeFetchTrending() {
  // TODO: implement once API credentials are live; keep stub for now
  return [];
}
