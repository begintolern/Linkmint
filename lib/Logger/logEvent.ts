// lib/logger/logEvent.ts
import { prisma } from "@/lib/db";

export async function logEvent({
  userId,
  type,
  message,
  detail,
}: {
  userId?: string | null; // ✅ Optional
  type: string;
  message?: string;
  detail?: string;
}) {
  try {
    await prisma.eventLog.create({
      data: {
        userId,
        type,
        message,
        detail,
      },
    });
  } catch (err) {
    console.error("Failed to write to eventLogs:", err);
  }
}
