// app/api/admin/auto-payout-toggle/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuardFromReq } from "@/lib/utils/adminGuardReq";
import { runAutoPayoutEngine } from "@/lib/engines/autoPayoutEngine"; // optional immediate run

// Accept POST as an alias for PATCH (some clients/pages may still send POST)
export async function POST(req: NextRequest) {
  return PATCH(req);
}

const KEY = "autoPayoutEnabled";

function parseBool(str: string | null | undefined): boolean | null {
  if (str == null) return null;
  const s = String(str).trim().toLowerCase();
  if (s === "true" || s === "1" || s === "yes") return true;
  if (s === "false" || s === "0" || s === "no") return false;
  return null;
}

// GET: { success, enabled }
export async function GET(req: NextRequest) {
  const gate = await adminGuardFromReq(req);
  if (!gate.ok) return gate.res;

  const row = await prisma.systemSetting.findUnique({
    where: { key: KEY },
    select: { value: true },
  });

  const enabled = row?.value != null ? parseBool(row.value) ?? false : false;
  return NextResponse.json({ success: true, enabled });
}

// PATCH: body { enabled: boolean } → { success, enabled, triggered? }
export async function PATCH(req: NextRequest) {
  const gate = await adminGuardFromReq(req);
  if (!gate.ok) return gate.res;

  let body: { enabled?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    // fall through to validation error below
  }

  if (typeof body.enabled !== "boolean") {
    return NextResponse.json(
      { success: false, error: "enabled must be boolean" },
      { status: 400 }
    );
  }

  const nextVal = body.enabled ? "true" : "false";

  await prisma.systemSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: nextVal },
    update: { value: nextVal },
    select: { key: true, value: true }, // no updatedAt
  });

  // optional audit log
  await prisma.eventLog.create({
    data: {
      type: "admin",
      message: `Auto payout ${body.enabled ? "ENABLED" : "DISABLED"}`,
      detail: JSON.stringify({ key: KEY, value: nextVal }),
    },
  });

  // optional: trigger engine immediately when enabling
  let triggered = false;
  if (body.enabled) {
    try {
      await runAutoPayoutEngine();
      triggered = true;
      await prisma.eventLog.create({
        data: { type: "payout", message: "Auto-payout immediate run triggered" },
      });
    } catch (e) {
      await prisma.eventLog.create({
        data: { type: "error", message: `Auto-payout immediate run failed: ${String(e)}` },
      });
    }
  }

  return NextResponse.json({
    success: true,
    enabled: body.enabled,
    triggered,
  });
  
}
