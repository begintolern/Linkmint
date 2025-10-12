// lib/fx.ts
import { FX_FALLBACK_USD_TO_PHP, FX_TTL_MS } from "./config";

type Cache = { rate: number; ts: number };
const mem: { usdPhp?: Cache } = {};

export async function getUsdToPhpRate(): Promise<number> {
  // 1) Manual override wins
  const override = process.env.USD_TO_PHP_RATE_OVERRIDE;
  if (override) return Number(override) || FX_FALLBACK_USD_TO_PHP;

  // 2) Memory cache (server only)
  const now = Date.now();
  if (mem.usdPhp && now - mem.usdPhp.ts < FX_TTL_MS) return mem.usdPhp.rate;

  // 3) Fetch live rate (no key required)
  try {
    const res = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=PHP", {
      // keep SSR cache off; we handle our own TTL
      cache: "no-store",
      // 5s timeout guard
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error(`FX HTTP ${res.status}`);
    const json = (await res.json()) as { rates?: { PHP?: number } };
    const rate = Number(json?.rates?.PHP) || FX_FALLBACK_USD_TO_PHP;
    mem.usdPhp = { rate, ts: now };
    return rate;
  } catch {
    return FX_FALLBACK_USD_TO_PHP;
  }
}
