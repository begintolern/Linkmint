export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendTelegramAlert } from "@/lib/telegram/notify";

export async function POST() {
  const user = await prisma.user.findFirst({
    where: { emailVerified: true },
  });

  if (!user) {
    return NextResponse.json({ success: false, error: "No verified user found" });
  }

  const newScore = (user.trustScore || 0) + 10;

  await prisma.user.update({
    where: { id: user.id },
    data: { trustScore: newScore },
  });

  await sendTelegramAlert(`🔒 TrustScore updated for ${user.email}: now ${newScore}`);

  return NextResponse.json({ success: true, message: `TrustScore updated to ${newScore}` });
}
