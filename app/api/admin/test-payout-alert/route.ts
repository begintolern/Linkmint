export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/telegram/sendAlert";
import { prisma } from "@/lib/db";

// Admin-only access
const ADMIN_ID = "clwzud5zr0000v4l5gnkz1oz3";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("linkmint_token")?.value;
  if (!token || token !== ADMIN_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { trustScore: { gt: 0 } },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "No eligible user found" });
    }

    await sendAlert(`💸 Test: Payout triggered for ${user.email}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Test payout alert error:", error);
    return NextResponse.json({ success: false, error: "Failed to send payout alert" }, { status: 500 });
  }
}
