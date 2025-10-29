// app/api/db-test/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  // SAFE ping using tagged template (no $queryRawUnsafe)
  const rows = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
  const ok = Array.isArray(rows) && rows[0]?.ok === 1;
  return NextResponse.json({ ok, rows });
}
