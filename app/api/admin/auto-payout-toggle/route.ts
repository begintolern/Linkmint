// app/api/admin/auto-payout-toggle/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertProdAdmin } from "@/lib/utils/adminGuard";

export async function POST() {
  try {
    const gate = await assertProdAdmin();
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const key = "autoPayoutsOn";

    // Read current value (string "true"/"false" or null)
    const current = await prisma.systemSetting.findUnique({ where: { key } });
    const currentVal = (current?.value ?? "false").toLowerCase() === "true";
    const nextVal = (!currentVal).toString(); // "true" | "false"

    // Flip it
    const updated = await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value: nextVal },
      update: { value: nextVal },
    });

    return NextResponse.json({
      success: true,
      value: updated.value.toLowerCase() === "true",
    });
  } catch (err) {
    console.error("auto-payout-toggle POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
