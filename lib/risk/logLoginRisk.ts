// lib/risk/logLoginRisk.ts

import { logRiskEvent } from "./safeLogger";

/**
 * Safe wrapper to log login-related context.
 *
 * This DOES NOT affect the login result.
 * If logging fails for any reason, it silently returns.
 */
export async function logLoginRiskSafe(params: {
  userId?: string | null;
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  outcome: "SUCCESS" | "INVALID_CREDENTIALS" | "UNVERIFIED" | "ERROR";
}) {
  const { userId, email, ip, userAgent, outcome } = params;

  let severity: "LOW" | "MEDIUM" | "HIGH" = "LOW";

  if (outcome === "INVALID_CREDENTIALS" || outcome === "UNVERIFIED") {
    severity = "MEDIUM";
  }
  if (outcome === "ERROR") {
    severity = "HIGH";
  }

  try {
    await logRiskEvent({
      userId: userId ?? null,
      reason: "LOGIN_CONTEXT",
      severity,
      details: {
        email,
        ip,
        userAgent,
        outcome,
      },
    });
  } catch {
    // Never allow logging to break login flow
  }
}
