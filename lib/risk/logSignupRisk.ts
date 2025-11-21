// lib/risk/logSignupRisk.ts

import { logRiskEvent } from "./safeLogger";

/**
 * Safe wrapper to log signup-related risk context.
 *
 * This DOES NOT affect the signup result.
 * If logging fails for any reason, it silently returns.
 */
export async function logSignupRiskSafe(params: {
  userId?: string | null;
  email?: string | null;
  referredById?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const { userId, email, referredById, ip, userAgent } = params;

  try {
    await logRiskEvent({
      userId: userId ?? null,
      reason: "SIGNUP_CONTEXT",
      severity: "LOW", // base level; we can compute real severity later
      details: {
        email,
        referredById,
        ip,
        userAgent,
      },
    });
  } catch {
    // Hard fail is never allowed here.
  }
}
