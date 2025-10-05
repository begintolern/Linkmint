// lib/audit/logPayoutEvent.ts
import type { PrismaClient } from "@prisma/client";

/**
 * Write a structured payout event to EventLog.
 * severity: 1=info, 2=warn, 3=error, 4=critical
 */
export async function logPayoutEvent(
  prisma: PrismaClient,
  params: {
    userId?: string | null;
    payoutRequestId?: string | null;
    type:
      | "PAYOUT_REQUESTED"
      | "PAYOUT_MARKED_PAID"
      | "PAYOUT_MARKED_FAILED"
      | "PAYOUT_ERROR";
    message?: string;
    severity?: 1 | 2 | 3 | 4;
    meta?: Record<string, any>;
  }
) {
  const { userId = null, payoutRequestId = null, type, message, severity = 1, meta = {} } = params;

  // compact, safe stringify
  let detail: string | undefined = undefined;
  try {
    detail = JSON.stringify({ payoutRequestId, ...meta });
  } catch {
    detail = undefined;
  }

  await prisma.eventLog.create({
    data: {
      userId: userId ?? undefined,
      type,
      message,
      detail,
      severity,
    },
  });
}
