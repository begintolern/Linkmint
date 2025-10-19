// app/api/admin/flags/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import {
  readFlagSnapshot,
  setAutoPayoutEnabled,
  setAutoDisburseEnabled,
  setAutoBatchLimit,
  setAutoAllowlistCsv,
} from "@/lib/config/flags";

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

  const snapshot = readFlagSnapshot();
  return NextResponse.json({ ok: true, ...snapshot });
}

export async function POST(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    /* ignore empty body */
  }

  if (typeof body?.autoPayoutEnabled === "boolean") {
    setAutoPayoutEnabled(body.autoPayoutEnabled);
  }
  if (typeof body?.autoPayoutDisburseEnabled === "boolean") {
    setAutoDisburseEnabled(body.autoPayoutDisburseEnabled);
  }
  if (typeof body?.autoPayoutBatchLimit === "number") {
    setAutoBatchLimit(body.autoPayoutBatchLimit);
  }
  if (typeof body?.autoPayoutAllowlistCsv === "string") {
    setAutoAllowlistCsv(body.autoPayoutAllowlistCsv);
  }

  const snapshot = readFlagSnapshot();
  return NextResponse.json({ ok: true, ...snapshot });
}
