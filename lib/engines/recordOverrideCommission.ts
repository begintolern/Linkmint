// lib/engines/recordOverrideCommission.ts
import { prisma } from "@/lib/db";

export async function recordOverrideCommission({
  referrerId,
  inviteeId,
  amount,
  sourceCommissionId,
  reason = "Referral bonus override",
}: {
  referrerId: string;
  inviteeId: string;
  amount: number;
  sourceCommissionId: string;
  reason?: string;
}) {
  try {
    await prisma.overrideCommission.create({
      data: {
        referrerId,
        inviteeId,
        amount,
        sourceCommissionId, // ✅ required field
        reason,
      },
    });
    console.log(`✅ Override commission of $${amount} recorded.`);
  } catch (error) {
    console.error("❌ Failed to record override commission:", error);
  }
}
