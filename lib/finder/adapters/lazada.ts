// lib/finder/adapters/lazada.ts
export function lazadaEnvReady() {
  return Boolean(
    process.env.LAZADA_APP_KEY &&
      process.env.LAZADA_APP_SECRET
  );
}

// Later: real implementation
export async function lazadaFetchTrending() {
  // TODO: implement once API credentials are live; keep stub for now
  return [];
}
