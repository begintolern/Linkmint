// app/api/admin/auto-payout-toggle/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";

function toBool(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.trim().toLowerCase() === "true";
  if (typeof val === "number") return val !== 0;
  return false;
}

export async function POST() {
  try {
    const gate = await adminGuard();
    if (!gate.ok) {
      return NextResponse.json({ error: gate.reason }, { status: gate.status });
    }

    const key = "autoPayoutsOn";

    // Read current (string | boolean | null) and flip it
    const current = await prisma.systemSetting.findUnique({ where: { key } });
    const next = !toBool((current as any)?.value);

    // Persist as string to avoid Prisma/DB type drift
    const updated = await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value: String(next) },
      update: { value: String(next) },
    });

    return NextResponse.json({
      success: true,
      value: toBool((updated as any).value),
    });
  } catch (err) {
    console.error("auto-payout-toggle POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
