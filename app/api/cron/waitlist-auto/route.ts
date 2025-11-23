// app/api/cron/waitlist-auto/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_CAP = 70;
const KEY_AUTO = "waitlist_auto_invite";
const KEY_CAP = "user_cap";

async function ensureConfigTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SystemConfig" (
      "key"   text PRIMARY KEY,
      "value" text NOT NULL
    )
  `);
}

async function getAutoEnabled() {
  await ensureConfigTable();
  const rows = (await prisma.$queryRawUnsafe(`
    SELECT "value"
    FROM "SystemConfig"
    WHERE "key" = '${KEY_AUTO}'
    LIMIT 1
  `)) as { value: string }[];

  const raw = rows && rows.length > 0 ? rows[0].value : "off";
  return raw === "on";
}

async function getCap() {
  await ensureConfigTable();
  const rows = (await prisma.$queryRawUnsafe(`
    SELECT "value"
    FROM "SystemConfig"
    WHERE "key" = '${KEY_CAP}'
    LIMIT 1
  `)) as { value: string }[];

  if (!rows || rows.length === 0) return DEFAULT_CAP;

  const cap = parseInt(rows[0].value, 10);
  return Number.isFinite(cap) ? cap : DEFAULT_CAP;
}

export async function GET() {
  try {
    // 1) Check if auto-invite is enabled
    const autoEnabled = await getAutoEnabled();
    if (!autoEnabled) {
      return NextResponse.json({
        ok: true,
        skipped: "auto_invite_disabled",
      });
    }

    // 2) Check capacity vs cap
    const cap = await getCap();
    const activeCount = await prisma.user.count();

    if (activeCount >= cap) {
      return NextResponse.json({
        ok: true,
        skipped: "at_or_over_cap",
        activeCount,
        cap,
      });
    }

    // 3) Find the next waiting user in the waitlist
    const next = await prisma.waitlist.findFirst({
      where: { status: "waiting" },
      orderBy: { createdAt: "asc" },
    });

    if (!next) {
      return NextResponse.json({
        ok: true,
        skipped: "no_waiting_users",
      });
    }

    // 4) Mark them as invited
    await prisma.waitlist.update({
      where: { id: next.id },
      data: { status: "invited" },
    });

    return NextResponse.json({
      ok: true,
      invitedId: next.id,
      email: next.email,
      reason: "invited_from_waitlist",
      activeCount,
      cap,
    });
  } catch (err: any) {
    console.error("[CRON WAITLIST AUTO] error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "unknown_error" },
      { status: 500 }
    );
  }
}
