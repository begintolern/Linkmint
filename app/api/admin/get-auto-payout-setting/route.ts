// app/api/admin/get-auto-payout-setting/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function toBool(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.trim().toLowerCase() === "true";
  if (typeof val === "number") return val !== 0;
  return false;
}

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "autoPayoutsOn" },
    });

    return NextResponse.json({
      success: true,
      value: toBool(setting?.value),
    });
  } catch (error) {
    console.error("Failed to fetch auto payout setting:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch setting." },
      { status: 500 }
    );
  }
}
