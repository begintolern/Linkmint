// lib/compliance/log.ts
import { prisma } from "@/lib/db";

/**
 * Lightweight compliance logger.
 * Ensures required Prisma fields exist on create (id, timestamps).
 */
export async function logComplianceEvent(opts: {
  type: string;
  message: string;
  severity: 1 | 2 | 3; // 1=low, 2=med, 3=high (adjust to your enum if needed)
  userId?: string | null;
  merchantId?: string | null;
  meta?: any;
}) {
  const { type, message, severity, userId = null, merchantId = null, meta } = opts;

  const now = new Date();

  // Keep the payload minimal; cast to any to avoid schema drift TS errors.
  const data: any = {
    id: crypto.randomUUID(), // ✅ required if your model lacks default @id
    createdAt: now,          // ✅ safe if model lacks @default(now())
    updatedAt: now,          // ✅ safe if model lacks @updatedAt

    type,
    message,
    severity,                // if your schema uses an enum, map/cast here
    userId,
    merchantId,
    meta: meta ?? null,      // JSON or String in your schema
  };

  try {
    await prisma.complianceEvent.create({ data });
  } catch (err) {
    // Last-resort guard: swallow to avoid breaking caller paths
    // You can add console.error in non-prod or send to an error tracker.
  }
}
