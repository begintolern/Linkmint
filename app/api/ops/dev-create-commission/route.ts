// app/api/ops/dev-create-commission/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma, CommissionType, CommissionStatus } from "@prisma/client";

// Get allowed enum values robustly (works across Prisma versions)
function enumValues<T extends Record<string, string> | undefined>(
  direct: T,
  $enums: any,
  name: string
): string[] {
  if (direct && typeof direct === "object") return Object.values(direct as any);
  const e = $enums?.[name];
  return e ? Object.values(e) : [];
}
const $E = (Prisma as any).$Enums || {};
const TYPE_VALUES = enumValues(CommissionType as any, $E, "CommissionType");
const STATUS_VALUES = enumValues(CommissionStatus as any, $E, "CommissionStatus");

// Pick a safe enum value: prefer a requested one if valid; else a sensible default; else first value.
function pickEnum(requested: any, allowed: string[], fallback?: string) {
  const want = String(requested ?? "").trim();
  if (want && allowed.includes(want)) return want;
  if (fallback && allowed.includes(fallback)) return fallback;
  return allowed[0]; // last resort: first defined enum value
}

function requireAdmin(req: Request) {
  const key = req.headers.get("x-admin-key");
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }
  return null;
}

/**
 * POST /api/ops/dev-create-commission
 * Body: { userId: string, amount?: number, status?: string, type?: string }
 * Defaults: amount=$10.00, status ~ APPROVED if available, type ~ first allowed
 */
export async function POST(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json().catch(() => ({}));
    const userId = String(body.userId ?? "");
    if (!userId) {
      return NextResponse.json({ ok: false, error: "userId_required" }, { status: 400 });
    }

    const amount = Number(body.amount ?? 10.0); // dollars
    const type = pickEnum(body.type, TYPE_VALUES, "SALE");          // will choose valid
    const status = pickEnum(body.status, STATUS_VALUES, "APPROVED"); // will choose valid

    if (!TYPE_VALUES.length || !STATUS_VALUES.length) {
      return NextResponse.json(
        { ok: false, error: "Commission enums not detected (CommissionType/CommissionStatus)." },
        { status: 500 }
      );
    }

    const data: any = {
      id: crypto.randomUUID(),
      userId,
      amount,         // finalizeCommission converts to cents internally
      type,           // valid enum value
      status,         // valid enum value
      // add timestamps here only if your schema requires them
    };

    const c = await prisma.commission.create({
      data,
      select: { id: true, userId: true, status: true, type: true },
    });

    return NextResponse.json({ ok: true, commission: c });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "unknown_error" }, { status: 400 });
  }
}
