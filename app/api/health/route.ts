// app/api/health/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const started = Date.now();

  // DB check with latency
  let dbOk = false;
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  const t0 = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (e: any) {
    dbError = e?.message ?? String(e);
  } finally {
    dbLatencyMs = Date.now() - t0;
  }

  // Runtime snapshot
  const mem = typeof process.memoryUsage === "function" ? process.memoryUsage() : undefined;
  const rssMB = mem ? Math.round((mem.rss / 1024 / 1024) * 10) / 10 : null;
  const heapMB = mem ? Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10 : null;

  const payload = {
    ok: dbOk,
    status: dbOk ? "ok" : "error",
    tookMs: Date.now() - started,
    uptimeSec: Math.round((typeof process.uptime === "function" ? process.uptime() : 0)),
    version:
      process.env.RAILWAY_GIT_COMMIT_SHA ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.COMMIT_SHA ||
      null,
    env: process.env.NODE_ENV || null,
    db: {
      ok: dbOk,
      latencyMs: dbLatencyMs,
      error: dbError,
    },
    runtime: {
      node: process.version,
      rssMB,
      heapMB,
    },
  };

  // Return 200 if healthy; 503 so monitors can alert when DB is down
  return NextResponse.json(payload, { status: dbOk ? 200 : 503 });
}
