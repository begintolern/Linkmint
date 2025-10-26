// lib/auditLog.ts
import type { PrismaClient } from "@prisma/client";

// Node 18+ has global crypto; keep a tiny fallback.
function genId() {
  try {
    // @ts-ignore
    if (globalThis.crypto?.randomUUID) {
      // @ts-ignore
      return globalThis.crypto.randomUUID();
    }
  } catch (_) {}
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

type LogPayload = {
  type: "USER_WARNING" | "SYSTEM" | "INFO" | "ERROR";
  message: string;
  json?: unknown;
};

/**
 * Attempts, in order:
 * 1) prisma.systemLog.create
 * 2) prisma.auditLog.create
 * 3) RAW SQL fallback to a "SystemLog" table (created if missing)
 * 4) console.warn as last resort
 */
export async function safeAuditLog(
  prisma: PrismaClient,
  payload: LogPayload
): Promise<void> {
  // 1) systemLog model (if your Prisma schema defines it)
  try {
    // @ts-ignore - schema-dependent
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
  } catch (_) {
    // fall through
  }

  // 2) auditLog model (if defined)
  try {
    // @ts-ignore - schema-dependent
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
  } catch (_) {
    // fall through
  }

  // 3) RAW SQL fallback (portable Postgres-first DDL)
  try {
    // Create table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemLog" (
        "id" TEXT PRIMARY KEY,
        "type" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "json" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const id = genId();
    const jsonStr = payload.json ? JSON.stringify(payload.json) : null;

    // Parameterized insert
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await prisma.$executeRaw`
      INSERT INTO "SystemLog" ("id","type","message","json")
      VALUES (${id}, ${payload.type}, ${payload.message}, ${jsonStr})
    `;
    return;
  } catch (_) {
    // final fallback to console
  }

  // 4) Console fallback
  const { type, message, json } = payload;
  // eslint-disable-next-line no-console
  console.warn(`[AUDIT:${type}] ${message}`, json ?? "");
}
