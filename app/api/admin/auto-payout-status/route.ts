// app/api/admin/auto-payout-status/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "autoPayoutsOn" },
    });

    return NextResponse.json({
      success: true,
      autoPayoutsOn: setting?.value === "true",
    });
  } catch (error) {
    console.error("Error fetching auto payout status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch payout status." },
      { status: 500 }
    );
  }
}
