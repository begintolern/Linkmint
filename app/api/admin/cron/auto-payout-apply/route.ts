// app/api/admin/cron/auto-payout-apply/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { autoPayoutApply } from "@/lib/engines/payout/autoApply";
import { isAutoDisburseEnabled, isAutoPayoutEnabled, getAutoBatchLimit } from "@/lib/config/flags";
import { acquireAutoPayoutLock, releaseAutoPayoutLock, peekAutoPayoutLock, forceUnlockAutoPayout } from "@/lib/config/lock";

function requireAdmin(req: Request) {
  const key = req.headers.get("x-admin-key");
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(req.url);
  if (searchParams.get("peek")) {
    const lock = await peekAutoPayoutLock();
    return NextResponse.json({ ok: true, lock });
  }
  return NextResponse.json({ ok: true, methods: ["POST"] });
}

export async function POST(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const on = await isAutoPayoutEnabled();
  const disburse = await isAutoDisburseEnabled();
  if (!on) {
    return NextResponse.json({ ok: false, error: "auto_payout_disabled" }, { status: 400 });
  }

  let limit = getAutoBatchLimit();
  let explainSkips = false;
  let forceUnlock = false;
  try {
    const body = await req.json().catch(() => ({} as any));
    if (typeof body?.limit === "number" && body.limit > 0 && body.limit <= 100) limit = body.limit | 0;
    if (typeof body?.explainSkips === "boolean") explainSkips = body.explainSkips;
    if (body?.forceUnlock === true) forceUnlock = true;
  } catch {}

  if (forceUnlock) {
    await forceUnlockAutoPayout();
    return NextResponse.json({ ok: true, unlocked: true });
  }

  // Acquire lock (60s TTL)
  const lock = await acquireAutoPayoutLock(60_000);
  if (!lock.ok) {
    return NextResponse.json({ ok: false, error: "locked", lock }, { status: 423 });
  }

  try {
    // ⬇️ Wrap the engine in a try/catch to avoid 500s
    try {
      const result = await autoPayoutApply({ limit, explainSkips });
      return NextResponse.json({ ...result, mode: disburse ? "DISBURSE" : "DRY_RUN" });
    } catch (err: any) {
      const payload = {
        ok: false,
        error: err?.message ?? String(err),
        stack: err?.stack ?? null,
      };
      return NextResponse.json(payload, { status: 500 });
    }
  } finally {
    await releaseAutoPayoutLock();
  }
}
