// app/api/admin/flags/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import {
  readFlagSnapshot,
  setAutoDisburseEnabled,
  setAutoPayoutEnabled,
} from "@/lib/config/flags";

/** Admin key guard */
function requireAdmin(req: Request) {
  const key = req.headers.get("x-admin-key");
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }
  return null;
}

/** GET: read env + effective (DB-backed) */
export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  return NextResponse.json({ ok: true, ...(await readFlagSnapshot()) });
}

/**
 * POST: set flags persistently (DB)
 * Body:
 * { autoPayoutEnabled?: boolean, autoPayoutDisburseEnabled?: boolean }
 */
export async function POST(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json().catch(() => ({} as any));

    if (Object.prototype.hasOwnProperty.call(body, "autoPayoutEnabled")) {
      if (typeof body.autoPayoutEnabled === "boolean") {
        await setAutoPayoutEnabled(body.autoPayoutEnabled);
      }
    }
    if (Object.prototype.hasOwnProperty.call(body, "autoPayoutDisburseEnabled")) {
      if (typeof body.autoPayoutDisburseEnabled === "boolean") {
        await setAutoDisburseEnabled(body.autoPayoutDisburseEnabled);
      }
    }

    return NextResponse.json({ ok: true, ...(await readFlagSnapshot()) });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "bad_request" }, { status: 400 });
  }
}
