import { prisma } from "@/lib/db";

/** Minimal JSON type (no dependency on Prisma typings) */
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

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

  // Best-effort: ensure meta is JSON-serializable
  const toJsonValue = (v: unknown): JsonValue | undefined => {
    if (typeof v === "undefined") return undefined;
    try {
      // Throws if circular / non-serializable
      JSON.stringify(v);
      return v as unknown as JsonValue;
    } catch {
      // Fallback to string representation
      return String(v) as unknown as JsonValue;
    }
  };

  try {
    await prisma.complianceEvent.create({
      data: {
        type,
        message,
        severity,
        userId,
        merchantId,
        meta: toJsonValue(meta) as any, // allow whatever your Prisma JSON column expects
      },
    });
  } catch (err) {
    // Never throw — compliance logging must not break the app
    console.error("[compliance] logEvent failed:", err);
  }
}
