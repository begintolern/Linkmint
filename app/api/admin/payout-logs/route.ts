// app/api/admin/payout-logs/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const adminKey = req.headers.get("x-admin-key");
  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const logs = await prisma.payout.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        amount: true,
        method: true,
        status: true,
        details: true,
        createdAt: true,
        approvedAt: true,
        paidAt: true,
      },
    });

    return NextResponse.json({ success: true, logs });
  } catch (err) {
    console.error("payout-logs GET error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch payout logs" }, { status: 500 });
  }
}
