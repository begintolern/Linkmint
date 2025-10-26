// app/api/admin/db-tables/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function isAdmin(req: NextRequest): boolean {
  const key = process.env.ADMIN_API_KEY || "";
  return (
    req.cookies.get("admin_key")?.value === key ||
    req.headers.get("x-admin-key") === key
  );
}

/**
 * GET /api/admin/db-tables
 * Lists visible tables in the current database schema.
 */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name;
    `);
    return NextResponse.json({ ok: true, tables: rows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
