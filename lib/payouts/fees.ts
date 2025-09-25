// lib/payouts/fees.ts

/**
 * Supported providers. Kept as a string union, no Prisma enum.
 */
export type PayoutProvider = "PAYPAL" | "PAYONEER";

/**
 * Calculate payout fee and net amount.
 * @param provider - payout provider ("PAYPAL" | "PAYONEER")
 * @param amountCents - gross amount in cents
 */
export function quoteFeeCents(provider: PayoutProvider, amountCents: number) {
  let feeCents = 0;

  if (provider === "PAYPAL") {
    // Example: 2.9% + 30¢
    feeCents = Math.round(amountCents * 0.029 + 30);
  } else if (provider === "PAYONEER") {
    // Example: flat 1%
    feeCents = Math.round(amountCents * 0.01);
  }

  const netCents = Math.max(0, amountCents - feeCents);

  return { feeCents, netCents };
}
