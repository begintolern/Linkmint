// lib/engines/recordCommission.ts
import { prisma } from "@/lib/db";
import { sendAlert } from "@/lib/telegram/sendAlert";
import { sendEmail } from "@/lib/email/sendEmail";

/**
 * Records a commission for a user.
 * - No Prisma enum dependency (type is plain string)
 * - Status defaults to "Pending" (adjust casing if your schema differs)
 * - paidOut defaults to false
 */
export type RecordCommissionInput = {
  userId: string;
  amount: number;              // dollars; will be stored as Decimal by Prisma
  type?: string;               // e.g. "Referral" | "Sale" | ...
  source?: string;             // e.g. "AMAZON", "CJ", etc.
  status?: string;             // default "Pending" (match your schema casing)
  note?: string | null;
};

export async function recordCommission(input: RecordCommissionInput) {
  const {
    userId,
    amount,
    type = "Referral",
    source = "MANUAL",
    status = "Pending", // <- adjust to your schema if needed
    note = null,
  } = input;

  if (!userId) throw new Error("recordCommission: userId is required");
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("recordCommission: amount must be a positive number");
  }

  // Create commission
  const commission = await prisma.commission.create({
    data: {
      userId,
      amount,         // Prisma will coerce to Decimal
      status,         // string field in your schema
      paidOut: false, // boolean we added to schema
      type,           // optional string
      source,         // optional string if present in your schema; remove if not
      note,           // optional string if present; remove if not
    } as any,
  });

  // Fire-and-forget notifications (non-blocking)
  try {
    await sendAlert(`🧾 Commission recorded: $${amount.toFixed(2)} for user ${userId} (${type}/${source})`);
  } catch (e) {
    console.warn("sendAlert failed (non-blocking):", e);
  }

  try {
    await sendEmail({
      to: process.env.OP_ALERT_EMAIL || "ops@linkmint.co",
      subject: "Commission recorded",
      text: `Commission recorded for user ${userId}\nAmount: $${amount.toFixed(2)}\nType: ${type}\nSource: ${source}\nStatus: ${status}`,
    });
  } catch (e) {
    console.warn("sendEmail failed (non-blocking):", e);
  }

  return commission;
}

export default recordCommission;
