// app/api/ops/health-check/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOpsHealth } from "@/lib/ops/health";

const TOKEN  = process.env.TELEGRAM_BOT_TOKEN || "";
// support either TELEGRAM_CHAT_ID (your existing) or TELEGRAM_ADMIN_CHAT_ID (new pack)
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || "";
const SECRET  = process.env.HEALTH_ALERT_SECRET || "";
const LATENCY = Number(process.env.HEALTH_LATENCY_THRESHOLD_MS ?? 600);

async function sendTelegram(text: string) {
  if (!TOKEN || !CHAT_ID) return;
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "Markdown" }),
    });
  } catch { /* best-effort */ }
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!SECRET || key !== SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Inline health check (no internal HTTP)
  const started = Date.now();
  let dbOk = false, dbLatency: number | null = null, dbErr: string | null = null;

  const t0 = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (e: any) {
    dbErr = e?.message ?? String(e);
  } finally {
    dbLatency = Date.now() - t0;
  }

  const mem = typeof process.memoryUsage === "function" ? process.memoryUsage() : undefined;
  const rssMB = mem ? Math.round((mem.rss / 1024 / 1024) * 10) / 10 : null;
  const heapMB = mem ? Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10 : null;

  const unhealthy = !dbOk;
  const slow = Number.isFinite(dbLatency!) && (dbLatency as number) > LATENCY;
  const took = Date.now() - started;

  // NEW: consolidated ops snapshot (recent errors, payout queue, auto-payout flag, etc.)
  const opsHealth = await getOpsHealth();

  if (unhealthy || slow) {
    const msg =
      `*Linkmint Health Alert*\n` +
      `Status: ${unhealthy ? "UNHEALTHY" : "SLOW"}\n` +
      `DB latency: ${dbLatency ?? "n/a"}ms (threshold ${LATENCY}ms)\n` +
      `Uptime: ${Math.round((typeof process.uptime === "function" ? process.uptime() : 0))}s\n` +
      `Commit: ${process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || "n/a"}\n` +
      `Env: ${process.env.NODE_ENV || "n/a"}\n` +
      `RSS: ${rssMB ?? "n/a"}MB, Heap: ${heapMB ?? "n/a"}MB\n` +
      (dbErr ? `DB error: ${dbErr}\n` : "") +
      `Ops: recentErrors=${opsHealth.recentErrors}, payoutQueue=${opsHealth.payoutQueue}, autoPayout=${opsHealth.autoPayoutEnabled}`;
    await sendTelegram(msg);
  }

  return NextResponse.json({
    ok: !unhealthy && !slow,
    unhealthy,
    slow,
    status: dbOk ? 200 : 503,
    dbLatency,
    threshold: LATENCY,
    tookMs: took,
    health: {
      ok: dbOk,
      status: dbOk ? "ok" : "error",
      db: { ok: dbOk, latencyMs: dbLatency, error: dbErr },
      runtime: {
        node: process.version,
        rssMB,
        heapMB,
        uptimeSec: Math.round((typeof process.uptime === "function" ? process.uptime() : 0)),
        version: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || null,
        env: process.env.NODE_ENV || null,
      },
    },
    // NEW: attach consolidated ops snapshot
    opsHealth,
  }, { status: dbOk ? 200 : 503 });
}
