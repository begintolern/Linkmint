// app/api/admin/cron/auto-payout-apply/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { isAutoDisburseEnabled, isAutoPayoutEnabled } from "@/lib/config/flags";

// Simple admin-key gate (same as other admin ops)
function requireAdmin(req: Request) {
  const key = req.headers.get("x-admin-key");
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }
  return null;
}

// (Optional) If you already have an engine, import and call it here
// import { autoPayoutApply } from "@/lib/engines/payout/autoApply";

export async function POST(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  // Check flags (DB-backed async)
  const on = await isAutoPayoutEnabled();
  const disburse = await isAutoDisburseEnabled();
  if (!on) {
    return NextResponse.json({ ok: false, error: "auto_payout_disabled" }, { status: 400 });
  }

  // If you have an engine, run it here:
  // const result = await autoPayoutApply({ disburse });
  // return NextResponse.json({ ok: true, ...result, mode: disburse ? "DISBURSE" : "DRY_RUN" });

  // Temporary safe stub so the endpoint works now:
  return NextResponse.json({
    ok: true,
    applied: 0,
    mode: disburse ? "DISBURSE" : "DRY_RUN",
    note: "stubbed apply; wire engine when ready",
  });
}

// Optional: return method info for GET so you can ping it in browser
export async function GET() {
  return NextResponse.json({ ok: true, methods: ["POST"] });
}
