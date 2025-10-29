// app/api/db-ping/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  // SAFE ping using tagged template (no $queryRawUnsafe)
  const r = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
  const ok = Array.isArray(r) && r[0]?.ok === 1;
  return NextResponse.json({ ok, raw: r });
}
