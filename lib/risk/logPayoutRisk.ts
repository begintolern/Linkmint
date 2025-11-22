// lib/risk/logPayoutRisk.ts

import { logRiskEvent } from "./safeLogger";

/**
 * Safe wrapper to log payout-related risk context.
 *
 * This DOES NOT affect the payout result.
 * If logging fails for any reason, it silently returns.
 */
export async function logPayoutRiskSafe(params: {
  userId?: string | null;
  payoutId?: string | null;
  amount: number;
  currency: string;
  method?: "PAYPAL" | "GCASH" | "BANK" | "OTHER";
  ip?: string | null;
  userAgent?: string | null;
  status?: "REQUESTED" | "APPROVED" | "SENT" | "FAILED";
}) {
  const {
    userId,
    payoutId,
    amount,
    currency,
    method = "PAYPAL",
    ip,
    userAgent,
    status = "REQUESTED",
  } = params;

  // Very simple severity heuristic for now
  let severity: "LOW" | "MEDIUM" | "HIGH" = "LOW";

  if (amount >= 100) {
    severity = "MEDIUM";
  }
  if (amount >= 500) {
    severity = "HIGH";
  }

  try {
    await logRiskEvent({
      userId: userId ?? null,
      reason: "PAYOUT_CONTEXT",
      severity,
      details: {
        payoutId,
        amount,
        currency,
        method,
        ip,
        userAgent,
        status,
      },
    });
  } catch {
    // Never allow payout logging to break payout flow
  }
}
