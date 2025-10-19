// app/api/admin/cron/auto-payout-apply/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { autoPayoutApply } from "@/lib/engines/payout/autoApply";
import { isAutoDisburseEnabled, isAutoPayoutEnabled } from "@/lib/config/flags";

/** Admin key guard (same pattern as other admin APIs) */
function requireAdmin(req: Request) {
  const key = req.headers.get("x-admin-key");
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }
  return null;
}

/** Helpful ping for browser GETs */
export async function GET() {
  return NextResponse.json({ ok: true, methods: ["POST"] });
}

/** Run the auto-payout apply pass (flag-gated). */
export async function POST(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const on = await isAutoPayoutEnabled();
  const disburse = await isAutoDisburseEnabled();
  if (!on) {
    return NextResponse.json({ ok: false, error: "auto_payout_disabled" }, { status: 400 });
  }

  // Optional: allow an explicit batch limit (1..100)
  let limit = 20;
  try {
    const body = await req.json().catch(() => ({} as any));
    if (typeof body?.limit === "number" && body.limit > 0 && body.limit <= 100) {
      limit = body.limit | 0;
    }
  } catch {
    /* ignore body parse issues; keep default limit */
  }

  // Execute the apply pass (this calls finalizeCommission on eligible items)
  const result = await autoPayoutApply({ limit });

  return NextResponse.json({
    ...result,
    mode: disburse ? "DISBURSE" : "DRY_RUN",
  });
}
