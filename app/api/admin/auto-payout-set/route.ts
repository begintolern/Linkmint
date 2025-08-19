// app/api/admin/auto-payout-set/route.ts
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

export async function POST(req: Request) {
  try {
    const gate = await adminGuard();
    if (!gate.ok) {
      return NextResponse.json({ error: gate.reason }, { status: gate.status });
    }

    const body = await req.json().catch(() => ({}));
    const desired = toBool((body as any)?.value);
    const key = "autoPayoutsOn";

    const updated = await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value: desired as any }, // supports boolean or string column
      update: { value: desired as any },
    });

    return NextResponse.json({
      success: true,
      value: toBool((updated as any).value),
      message: `Auto payout set to ${toBool((updated as any).value)}.`,
    });
  } catch (err) {
    console.error("auto-payout-set POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
