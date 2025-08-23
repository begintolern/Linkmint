// lib/payouts/logPayPalPayoutEvent.ts
import { prisma } from "@/lib/db";

/**
 * Writes a payout event to EventLog.
 * userId is optional; pass it if you know who the payout is for.
 */
export async function logPayPalPayoutEvent(opts: {
  userId?: string | null;
  receiverEmail: string;
  amount: number | string;
  paypalBatchId?: string | null;
  transactionId?: string | null;
  note?: string | null;
}) {
  const {
    userId = null,
    receiverEmail,
    amount,
    paypalBatchId = null,
    transactionId = null,
    note = null,
  } = opts;

  const detail = JSON.stringify({
    receiverEmail,
    amount: typeof amount === "number" ? amount : Number(amount),
    paypalBatchId,
    transactionId,
    note,
  });

  await prisma.eventLog.create({
    data: {
      userId: userId ?? undefined,
      type: "payout",
      message: `PayPal payout created${paypalBatchId ? ` (batch ${paypalBatchId})` : ""}`,
      detail,
    },
  });
}
