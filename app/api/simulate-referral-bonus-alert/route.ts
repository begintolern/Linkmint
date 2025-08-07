// app/api/simulate-referral-bonus-alert/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { sendAlert } from "@/lib/telegram/sendAlert";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // Restrict to admin only (user ID: clwzud5zr0000v4l5gnkz1oz3)
  if (!session || session.user.id !== "clwzud5zr0000v4l5gnkz1oz3") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const simulatedUserEmail = "refbase@test.com";
  const bonusAmount = 3.00;

  await sendAlert(
    `🎉 *Referral Bonus Activated!*\n\nUser: ${simulatedUserEmail}\nBonus: $${bonusAmount.toFixed(
      2
    )} earned from active referral batch.\n\nKeep inviting to earn more!`
  );

  return NextResponse.json({ success: true, message: "Simulated referral bonus alert sent." });
}
