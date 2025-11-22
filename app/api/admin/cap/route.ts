// app/api/admin/cap/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Default cap if nothing is configured yet
const DEFAULT_CAP = 70;

// Helper: ensure the SystemConfig table exists
async function ensureConfigTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SystemConfig" (
      "key"   text PRIMARY KEY,
      "value" text NOT NULL
    )
  `);
}

// GET: read current cap
export async function GET() {
  try {
    await ensureConfigTable();

    const rows = (await prisma.$queryRawUnsafe(`
      SELECT "value"
      FROM "SystemConfig"
      WHERE "key" = 'user_cap'
      LIMIT 1
    `)) as { value: string }[];

    const cap = rows && rows.length > 0 ? parseInt(rows[0].value, 10) : DEFAULT_CAP;

    return NextResponse.json({
      ok: true,
      cap: Number.isNaN(cap) ? DEFAULT_CAP : cap,
      defaultCap: DEFAULT_CAP,
    });
  } catch (err: any) {
    console.error("[ADMIN CAP][GET] error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "unknown_error" },
      { status: 500 }
    );
  }
}

// POST: update cap
export async function POST(req: Request) {
  try {
    await ensureConfigTable();

    const body = await req.json().catch(() => ({}));
    const rawCap = body?.cap;

    const capNum = Number(rawCap);
    if (!Number.isFinite(capNum) || capNum <= 0 || capNum > 100000) {
      return NextResponse.json(
        { ok: false, error: "invalid_cap_value" },
        { status: 400 }
      );
    }

    await prisma.$executeRawUnsafe(`
      INSERT INTO "SystemConfig" ("key", "value")
      VALUES ('user_cap', '${capNum}')
      ON CONFLICT ("key")
      DO UPDATE SET "value" = EXCLUDED."value"
    `);

    return NextResponse.json({
      ok: true,
      cap: capNum,
      message: "Cap updated",
    });
  } catch (err: any) {
    console.error("[ADMIN CAP][POST] error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "unknown_error" },
      { status: 500 }
    );
  }
}
