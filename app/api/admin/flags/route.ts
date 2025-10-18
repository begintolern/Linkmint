// app/api/admin/flags/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { readFlagSnapshot } from "@/lib/config/flags";

/** Admin key guard (same as other admin ops) */
function requireAdmin(req: Request) {
  const key = req.headers.get("x-admin-key");
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }
  return null;
}

/** GET: read env, overrides, and effective states (READ-ONLY) */
export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  return NextResponse.json({ ok: true, ...readFlagSnapshot() });
}
