// lib/compliance/log.ts
import { prisma } from "@/lib/db";

/**
 * Lightweight compliance logger.
 * Ensures required Prisma fields exist on create (id, timestamps).
 */
export async function logComplianceEvent(opts: {
  type: string;
  message: string;
  severity: 1 | 2 | 3; // 1=low, 2=med, 3=high
  userId?: string | null;
  merchantId?: string | null;
  meta?: any;
}) {
  const { type, message, severity, userId = null, merchantId = null, meta } = opts;

  const now = new Date();

  const data: any = {
    id: crypto.randomUUID(), // required if no default @id
    createdAt: now,          // safe if no @default(now())
    updatedAt: now,          // safe if no @updatedAt
    type,
    message,
    severity,                // if your schema uses an enum, map/cast here
    userId,
    merchantId,
    meta: meta ?? null,      // JSON or String in your schema
  };

  try {
    await prisma.complianceEvent.create({ data });
  } catch {
    // Swallow to avoid breaking callers; add telemetry if desired
  }
}

/** Back-compat alias so existing imports keep working */
export const logEvent = logComplianceEvent;

/** Optional default export (handy for generic imports) */
export default logComplianceEvent;
