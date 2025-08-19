// lib/logEvent.ts
import { prisma } from "@/lib/db";

type LogInput = {
  type: string;
  message?: string | null;
  detail?: string | null;   // schema has detail as String?
  userId?: string | null;
};

/**
 * Fire-and-forget logger. Won’t throw if logging fails.
 */
export async function logEvent(input: LogInput) {
  try {
    await prisma.eventLog.create({
      data: {
        type: input.type,
        message: input.message ?? null,
        detail: input.detail ?? null,
        userId: input.userId ?? null,
      },
      select: { id: true },
    });
  } catch (err) {
    // Don’t crash app if logging fails
    console.error("[logEvent] failed:", err);
  }
}
