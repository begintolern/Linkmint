// app/api/system/cap/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_CAP = 70;

// fetch cap from SystemConfig
async function getCap() {
  try {
    const rows = (await prisma.$queryRawUnsafe(`
      SELECT "value"
      FROM "SystemConfig"
      WHERE "key" = 'user_cap'
      LIMIT 1
    `)) as { value: string }[];

    if (!rows || rows.length === 0) return DEFAULT_CAP;

    const cap = parseInt(rows[0].value, 10);
    return Number.isFinite(cap) ? cap : DEFAULT_CAP;
  } catch {
    return DEFAULT_CAP;
  }
}

export async function GET() {
  try {
    const cap = await getCap();

    const activeCount = await prisma.user.count();

    return NextResponse.json({
      ok: true,
      canSignup: activeCount < cap,
      activeCount,
      max: cap,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "unknown_error" },
      { status: 500 }
    );
  }
}
