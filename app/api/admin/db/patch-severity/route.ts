// app/api/admin/db/patch-severity/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  // Use the same ops key convention you already use for self-heal/alerts
  const key = req.headers.get("x-ops-key");
  const OPS_KEY =
    process.env.OPS_KEY ||
    process.env.OPS_ADMIN_KEY ||
    process.env.HEALTH_ALERT_SECRET ||
    process.env.ADMIN_OPS_KEY;

  if (!OPS_KEY || key !== OPS_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    // 1) Add column if missing (nullable first)
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'EventLog' AND column_name = 'severity'
        ) THEN
          ALTER TABLE "EventLog" ADD COLUMN "severity" INTEGER;
        END IF;
      END $$;
    `);

    // 2) Backfill nulls to default value 1 (info)
    await prisma.$executeRawUnsafe(`
      UPDATE "EventLog" SET "severity" = 1 WHERE "severity" IS NULL;
    `);

    // 3) Enforce DEFAULT and NOT NULL going forward
    await prisma.$executeRawUnsafe(`ALTER TABLE "EventLog" ALTER COLUMN "severity" SET DEFAULT 1;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "EventLog" ALTER COLUMN "severity" SET NOT NULL;`);

    // Quick sample so we can see it worked
    const sample = await prisma.eventLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, severity: true },
    });

    return NextResponse.json({ ok: true, sample });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
