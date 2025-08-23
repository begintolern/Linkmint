// lib/payouts/fees.ts
import type { PayoutProvider } from "@prisma/client";

// Defaults (tweak later or make env-configurable)
const PAYPAL_RATE = 0.029;   // 2.9%
const PAYPAL_FIXED = 30;     // $0.30 in cents
const PAYONEER_FLAT = 200;   // $2.00 flat (example)

export function quoteFeeCents(provider: PayoutProvider, amountCents: number) {
  if (!amountCents || amountCents <= 0) return { feeCents: 0, netCents: 0 };

  if (provider === "PAYPAL") {
    const pct = Math.round(amountCents * PAYPAL_RATE);
    const feeCents = pct + PAYPAL_FIXED;
    const netCents = Math.max(0, amountCents - feeCents);
    return { feeCents, netCents };
  }

  if (provider === "PAYONEER") {
    const feeCents = PAYONEER_FLAT;
    const netCents = Math.max(0, amountCents - feeCents);
    return { feeCents, netCents };
  }

  return { feeCents: 0, netCents: amountCents };
}
