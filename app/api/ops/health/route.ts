// app/api/ops/health/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

async function getRecentErrors15m() {
  const since = new Date(Date.now() - 15 * 60 * 1000);
  try {
    // Be robust: severity>=3 OR type in ERROR/FAIL/CRITICAL OR message contains "error"
    const count = await prisma.eventLog.count({
      where: {
        createdAt: { gte: since },
        OR: [
          { severity: { gte: 3 } as any },
          { type: { in: ["ERROR", "FAIL", "CRITICAL"] } as any },
          { type: { in: ["error", "fail", "critical"] } as any }, // case-insensitive fallback if DB is case-sensitive
          { message: { contains: "error", mode: "insensitive" } as any },
        ],
      } as any,
    });
    return count;
  } catch {
    return 0;
  }
}

async function getPayoutQueue() {
  try {
    return await prisma.payout.count({
      where: { statusEnum: { in: ["PENDING", "PROCESSING"] } as any },
    });
  } catch {
    return 0;
  }
}

async function getAutoPayoutFlag(): Promise<boolean | null> {
  try {
    const anyPrisma = prisma as any;
    const candidates = [
      { model: anyPrisma.appSetting, keyField: "key", valField: "value" },
      { model: anyPrisma.appSettings, keyField: "key", valField: "value" },
      { model: anyPrisma.setting, keyField: "key", valField: "value" },
      { model: anyPrisma.settings, keyField: "key", valField: "value" },
      { model: anyPrisma.kv, keyField: "key", valField: "value" },
      { model: anyPrisma.config, keyField: "key", valField: "value" },
    ];
    for (const c of candidates) {
      if (!c?.model?.findUnique) continue;
      const row = await c.model.findUnique({
        where: { [c.keyField]: "autoPayoutEnabled" },
        select: { [c.valField]: true },
      });
      if (row && (c.valField in row)) {
        const v = String(row[c.valField]).toLowerCase();
        if (v === "true") return true;
        if (v === "false") return false;
        return null;
      }
    }
  } catch {}
  return null;
}

export async function GET() {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const recentErrors = await getRecentErrors15m();
  const payoutQueue = await getPayoutQueue();
  const autoPayoutEnabled = await getAutoPayoutFlag();

  const mem = typeof process.memoryUsage === "function" ? process.memoryUsage() : undefined;
  const rssMB = mem ? Math.round((mem.rss / 1024 / 1024) * 10) / 10 : null;
  const heapMB = mem ? Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10 : null;

  return NextResponse.json({
    ok: true,
    health: {
      now: new Date().toISOString(),
      dbOk,
      recentErrors,
      payoutQueue,
      autoPayoutEnabled,
      rssMB,
      heapMB,
    },
  });
}
