// lib/engines/recordOverrideCommission.ts

import { prisma } from "@/lib/db";

type Params = {
  referrerId: string;
  inviteeId: string;
  amount: number;
  sourceCommissionId: string;
  reason?: string;
};

export async function recordOverrideCommission({
  referrerId,
  inviteeId,
  amount,
  sourceCommissionId,
  reason = "Override commission",
}: Params) {
  return await prisma.overrideCommission.create({
    data: {
      referrerId,
      inviteeId,
      amount,
      sourceCommissionId,
      reason,
      status: "pending",
    },
  });
}
