// lib/engines/recordEventLog.ts
import { prisma } from "@/lib/db";

type LogEventParams = {
  userId: string;
  type: string; // e.g., "commission", "referral", "payout"
  message: string;
  detail?: string;
};

export async function recordEventLog({
  userId,
  type,
  message,
  detail,
}: LogEventParams) {
  await prisma.eventLog.create({
    data: {
      userId,
      type,
      message,
      detail,
    },
  });
}
