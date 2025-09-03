// app/api/ops/health-check/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const SECRET = process.env.HEALTH_ALERT_SECRET!;
const LATENCY = Number(process.env.HEALTH_LATENCY_THRESHOLD_MS ?? 600);
const SITE_ENV = process.env.SITE_URL || "";

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

  // Build base URL from request origin; fallback to SITE_URL env if provided.
  const origin = req.nextUrl.origin;
  const base = SITE_ENV || origin;

  const t0 = Date.now();
  let health: any = null;
  let status = 200;
  let fetchErr: string | null = null;

  try {
    const r = await fetch(`${base}/api/health`, { cache: "no-store" });
    status = r.status;
    health = await r.json().catch(() => null);
  } catch (e: any) {
    status = 503;
    fetchErr = e?.message || String(e);
    health = { ok: false, status: "error", error: fetchErr };
  }
  const took = Date.now() - t0;

  const dbLatency = Number(health?.db?.latencyMs ?? NaN);
  const unhealthy = status !== 200 || !health?.ok;
  const slow = Number.isFinite(dbLatency) && dbLatency > LATENCY;

  if (unhealthy || slow) {
    const msg =
      `*Linkmint Health Alert*\n` +
      `Status: ${unhealthy ? "UNHEALTHY" : "SLOW"}\n` +
      `HTTP: ${status}\n` +
      `DB latency: ${Number.isFinite(dbLatency) ? dbLatency + "ms" : "n/a"} (threshold ${LATENCY}ms)\n` +
      `Uptime: ${health?.uptimeSec ?? "n/a"}s\n` +
      `Commit: ${health?.version ?? "n/a"}\n` +
      `Env: ${health?.env ?? "n/a"}\n` +
      `Took: ${took}ms\n` +
      `${fetchErr ? `Fetch error: ${fetchErr}\n` : ""}` +
      `${unhealthy && health?.db?.error ? `DB error: ${health.db.error}` : ""}`;
    await sendTelegram(msg);
  }

  return NextResponse.json({
    ok: !unhealthy && !slow,
    unhealthy,
    slow,
    status,
    dbLatency,
    threshold: LATENCY,
    tookMs: took,
    health,
  });
}
