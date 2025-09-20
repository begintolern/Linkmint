import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Works on Postgres: list columns of "ClickEvent"
export async function GET() {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT column_name, data_type
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ClickEvent'
        ORDER BY ordinal_position;`
    );
    return NextResponse.json({ ok: true, columns: rows });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
