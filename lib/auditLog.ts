// lib/auditLog.ts
import type { PrismaClient } from "@prisma/client";

type LogPayload = {
  type: "USER_WARNING" | "SYSTEM" | "INFO" | "ERROR";
  message: string;
  json?: unknown;
};

/**
 * Attempts to record an event into your System or Audit Log.
 * If the model doesn’t exist, it safely falls back to console output.
 */
export async function safeAuditLog(
  prisma: PrismaClient,
  payload: LogPayload
): Promise<void> {
  try {
    // Try common log models
    // @ts-ignore - depends on your schema naming
    if (prisma.systemLog?.create) {
      // @ts-ignore
      await prisma.systemLog.create({
        data: {
          type: payload.type,
          message: payload.message,
          json: payload.json ? JSON.stringify(payload.json) : null,
        },
      });
      return;
    }
  } catch (_) {}

  try {
    // @ts-ignore
    if (prisma.auditLog?.create) {
      // @ts-ignore
      await prisma.auditLog.create({
        data: {
          type: payload.type,
          message: payload.message,
          json: payload.json ? JSON.stringify(payload.json) : null,
        },
      });
      return;
    }
  } catch (_) {}

  // Fallback: console output
  const { type, message, json } = payload;
  // eslint-disable-next-line no-console
  console.warn(`[AUDIT:${type}] ${message}`, json ?? "");
}
