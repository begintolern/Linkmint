// lib/auditLog.ts
import { randomUUID } from "crypto";
import type { PrismaClient } from "@prisma/client";

export type SystemLogType = "INFO" | "ERROR" | "SYSTEM" | "USER_WARNING";

/**
 * Back-compat shim for older routes importing "@/lib/auditLog".
 * Writes to SystemLog with an explicit id.
 */
export async function safeAuditLog(
  prisma: PrismaClient,
  payload: { type: SystemLogType; message: string; json?: unknown | null }
) {
  try {
    await prisma.systemLog.create({
      data: {
        id: randomUUID(),                 // SystemLog requires an id in your schema
        type: payload.type,
        message: payload.message,
        // If your column is JSON, raw objects are fine; otherwise keep as null
        json:
  payload.json != null
    ? typeof payload.json === "string"
      ? payload.json
      : JSON.stringify(payload.json)
    : null,
      },
    });
  } catch (e) {
    console.error("[safeAuditLog] failed:", e);
  }
}
