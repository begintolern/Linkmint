// app/api/admin/get-auto-payout-setting/route.ts
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
      value: setting?.value === "true",
    });
  } catch (error) {
    console.error("Failed to fetch auto payout setting:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch setting." }, { status: 500 });
  }
}
