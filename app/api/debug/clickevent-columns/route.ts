// app/api/debug/clickevent-columns/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
// If you want to restrict to admins only, uncomment:
// import { adminGuard } from "@/lib/utils/adminGuard";

type ColumnRow = {
  column_name: string;
  data_type: string;
  is_nullable?: string;
  column_default?: string | null;
  ordinal_position?: number;
};

export async function GET() {
  // const gate = await adminGuard();
  // if (!gate.ok) {
  //   return NextResponse.json({ ok: false, error: gate.reason }, { status: gate.status });
  // }

  try {
    const rows = (await prisma.$queryRawUnsafe(
      `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns
      WHERE table_name = 'ClickEvent'
      ORDER BY ordinal_position;
      `
    )) as unknown as ColumnRow[];

    return NextResponse.json({ ok: true, rows });
  } catch (err) {
    console.error("clickevent-columns debug error:", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch columns" }, { status: 500 });
  }
}
