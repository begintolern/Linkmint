// lib/log/logEvent.ts
import { prisma } from "@/lib/db";

/**
 * Write a row to EventLog.
 * @param type e.g. "payout", "error", "signup", "trust"
 * @param message human-readable summary
 * @param userId optional subject user id (the user the event is about)
 */
export async function logEvent(
  type: "payout" | "error" | "signup" | "trust" | string,
  message: string,
  userId?: string | null
) {
  try {
    await prisma.eventLog.create({
      data: {
        type,
        message,
        ...(userId ? { userId } : {}),
      } as any,
    });
  } catch (e) {
    // Non-blocking
    console.warn("[logEvent] failed:", e);
  }
}
