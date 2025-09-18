import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * Write a compliance event without ever crashing the request.
 * Usage:
 *   await logEvent({ type: "MERCHANT_CREATED", severity: 1, message: "Created merchant", merchantId, meta: {...} })
 */
export async function logEvent(args: {
  type: string;                 // e.g. "MERCHANT_CREATED", "DISALLOWED_SOURCE", "AUTO_SUSPEND"
  message: string;              // human-readable summary
  severity?: 1 | 2 | 3;         // 1=info, 2=warn, 3=critical
  userId?: string | null;
  merchantId?: string | null;
  meta?: unknown;               // any JSON-serializable object
}) {
  const { type, message, severity = 1, userId = null, merchantId = null, meta } = args;

  try {
    await prisma.complianceEvent.create({
      data: {
        type,
        message,
        severity,
        userId,
        merchantId,
        meta: typeof meta === "undefined" ? undefined : (meta as Prisma.InputJsonValue),
      },
    });
  } catch (err) {
    // Never throw — compliance logging must not break the app
    console.error("[compliance] logEvent failed:", err);
  }
}
