// app/api/admin/waitlist/auto/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const KEY = "waitlist_auto_invite";

// Make sure SystemConfig exists
async function ensureConfigTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SystemConfig" (
      "key"   text PRIMARY KEY,
      "value" text NOT NULL
    )
  `);
}

// GET: read current auto-invite setting
export async function GET() {
  try {
    await ensureConfigTable();

    const rows = (await prisma.$queryRawUnsafe(`
      SELECT "value"
      FROM "SystemConfig"
      WHERE "key" = '${KEY}'
      LIMIT 1
    `)) as { value: string }[];

    const raw = rows && rows.length > 0 ? rows[0].value : "off";
    const enabled = raw === "on";

    return NextResponse.json({
      ok: true,
      enabled,
    });
  } catch (err: any) {
    console.error("[WAITLIST AUTO][GET] error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "unknown_error" },
      { status: 500 }
    );
  }
}

// POST: update auto-invite setting
export async function POST(req: Request) {
  try {
    await ensureConfigTable();

    const body = await req.json().catch(() => ({}));
    const enabled = Boolean(body?.enabled);

    const value = enabled ? "on" : "off";

    await prisma.$executeRawUnsafe(`
      INSERT INTO "SystemConfig" ("key", "value")
      VALUES ('${KEY}', '${value}')
      ON CONFLICT ("key")
      DO UPDATE SET "value" = EXCLUDED."value"
    `);

    return NextResponse.json({
      ok: true,
      enabled,
      message: `Auto-invite is now ${enabled ? "ON" : "OFF"}.`,
    });
  } catch (err: any) {
    console.error("[WAITLIST AUTO][POST] error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "unknown_error" },
      { status: 500 }
    );
  }
}
