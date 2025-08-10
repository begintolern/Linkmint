export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const logs = await prisma.payout.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error("Error fetching payout logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payout logs" },
      { status: 500 }
    );
  }
}
