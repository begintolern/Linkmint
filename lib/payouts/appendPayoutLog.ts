// lib/payouts/appendPayoutLog.ts
import { prisma } from "@/lib/db";

export async function appendPayoutLog(opts: {
  userId?: string | null;
  receiverEmail?: string | null;
  amount?: number | string | null;
  paypalBatchId?: string | null;
  transactionId?: string | null;
  note?: string | null;
  status?: "CREATED" | "PAID" | "FAILED" | string | null;
}) {
  const {
    userId = null,
    receiverEmail = null,
    amount = null,
    paypalBatchId = null,
    transactionId = null,
    note = null,
    status = "CREATED",
  } = opts;

  const numericAmount =
    typeof amount === "number" ? amount : amount ? Number(amount) : null;

  return prisma.payoutLog.create({
    data: {
      userId: userId ?? undefined,
      receiverEmail: receiverEmail ?? undefined,
      amount: numericAmount ?? undefined,
      paypalBatchId: paypalBatchId ?? undefined,
      transactionId: transactionId ?? undefined,
      note: note ?? undefined,
      status: status ?? undefined,
    },
  });
}
