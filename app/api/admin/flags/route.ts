// app/api/admin/flags/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import {
  readFlagSnapshot,
  setAutoDisburseEnabledOverride,
  setAutoPayoutEnabledOverride,
} from "@/lib/config/flags";

/** Admin key guard */
function requireAdmin(req: Request) {
  const key = req.headers.get("x-admin-key");
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }
  return null;
}

/** GET: read env, overrides, and effective states */
export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  return NextResponse.json({ ok: true, ...readFlagSnapshot() });
}

/**
 * POST: set/clear overrides
 * Body:
 * {
 *   autoPayoutEnabled?: boolean | null,           // true/false sets override, null clears
 *   autoPayoutDisburseEnabled?: boolean | null    // true/false sets override, null clears
 * }
 */
export async function POST(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json().catch(() => ({} as any));

    if (Object.prototype.hasOwnProperty.call(body, "autoPayoutEnabled")) {
      const v = body.autoPayoutEnabled;
      setAutoPayoutEnabledOverride(typeof v === "boolean" ? v : undefined);
    }

    if (Object.prototype.hasOwnProperty.call(body, "autoPayoutDisburseEnabled")) {
      const v = body.autoPayoutDisburseEnabled;
      setAutoDisburseEnabledOverride(typeof v === "boolean" ? v : undefined);
    }

    return NextResponse.json({ ok: true, ...readFlagSnapshot() });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "bad_request" }, { status: 400 });
  }
}
