// app/api/debug/db/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type ColumnRow = { column_name: string };

export async function GET() {
  try {
    const cols = await prisma.$queryRaw<ColumnRow[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'User'
      ORDER BY column_name
    `;

    return NextResponse.json({
      ok: true,
      userTableColumns: cols.map((c: ColumnRow) => c.column_name),
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
