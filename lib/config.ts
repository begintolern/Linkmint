// lib/config.ts
export const REGION = process.env.REGION ?? "PH"; // default PH
export const FX_FALLBACK_USD_TO_PHP = Number(process.env.USD_TO_PHP_RATE ?? 58); // safety net
export const FX_TTL_MS = Number(process.env.USD_TO_PHP_TTL_MS ?? 6 * 60 * 60 * 1000); // 6h cache
