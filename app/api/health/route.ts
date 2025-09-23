// app/api/health/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const started = Date.now();

  // Parse query (verbose mode shows extra runtime details)
  const url = new URL(req.url);
  const verbose = url.searchParams.get("full") === "1";

  // DB check with short statement timeout + latency
  let dbOk = false;
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  const t0 = Date.now();
  try {
    // 2s per-request statement timeout (Postgres)
    await prisma.$executeRawUnsafe("SET LOCAL statement_timeout = 2000");
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (e: any) {
    dbError = e?.message ?? String(e);
  } finally {
    dbLatencyMs = Date.now() - t0;
  }

  // Optional runtime snapshot (only when full=1)
  let rssMB: number | null = null;
  let heapMB: number | null = null;
  if (verbose && typeof process.memoryUsage === "function") {
    const mem = process.memoryUsage();
    rssMB = Math.round((mem.rss / 1024 / 1024) * 10) / 10;
    heapMB = Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10;
  }

  const payload = {
    ok: dbOk,
    status: dbOk ? "ok" : "error",
    tookMs: Date.now() - started,
    uptimeSec: Math.round(typeof process.uptime === "function" ? process.uptime() : 0),
    env: process.env.NODE_ENV || null,
    region: process.env.RAILWAY_REGION || process.env.VERCEL_REGION || null,
    version:
      process.env.APP_VERSION ||
      process.env.RAILWAY_GIT_COMMIT_SHA ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.COMMIT_SHA ||
      null,
    db: {
      ok: dbOk,
      latencyMs: dbLatencyMs,
      error: dbError,
    },
    ...(verbose
      ? {
          runtime: {
            node: process.version,
            rssMB,
            heapMB,
          },
        }
      : {}),
    now: new Date().toISOString(),
  };

  return NextResponse.json(payload, {
    status: dbOk ? 200 : 503,
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}
