export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { recordCommission } from "@/lib/engines/recordCommission";
import { recordEventLog } from "@/lib/engines/recordEventLog";
import { recordOverrideCommission } from "@/lib/engines/recordOverrideCommission";
import { addDays, isBefore } from "date-fns";

export async function POST(req: Request) {
  const body = await req.json();
  const email = body.email;
  const secret = req.headers.get("x-simulate-secret");

  // ✅ Validate secret
  if (secret !== process.env.SIMULATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { referralGroup: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const total = 4.55;
  const linkmintCut = Number((total * 0.15).toFixed(2)); // 15%
  const remaining = Number((total - linkmintCut).toFixed(2)); // 85%
  const overrideAmount = Number((remaining * 0.05).toFixed(2)); // 5% of 85%
  const userAmount = Number((remaining - overrideAmount).toFixed(2)); // rest goes to user

  // ✅ Record user commission
  await recordCommission({
    userId: user.id,
    amount: userAmount,
    type: "referral_purchase",
    description: "Simulated commission after Linkmint + referrer cut",
  });

  await recordEventLog({
    userId: user.id,
    type: "commission",
    message: `$${userAmount} commission credited (simulated)`,
  });

  // ✅ Handle override if invited
  if (user.referredById) {
    const inviter = await prisma.user.findUnique({
      where: { id: user.referredById },
      include: { referralGroup: true },
    });

    const startedAt = inviter?.referralGroup?.startedAt;
    const now = new Date();

    if (startedAt && isBefore(now, addDays(startedAt, 90))) {
      await recordOverrideCommission({
        referrerId: inviter.id,
        inviteeId: user.id,
        amount: overrideAmount,
        sourceCommissionId: "simulated",
        reason: "5% referral override during bonus window",
      });

      await recordEventLog({
        userId: inviter.id,
        type: "override_commission",
        message: `$${overrideAmount} override commission from ${user.email}`,
      });
    }
  }

  // ✅ Optionally log Linkmint's retained commission if needed
  // This can later be stored for audit or analytics

  return NextResponse.json({ success: true, message: "Simulated purchase created." });
}
