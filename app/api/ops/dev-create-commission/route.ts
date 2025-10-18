// app/api/ops/dev-create-commission/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function requireAdmin(req: Request) {
  const key = req.headers.get("x-admin-key");
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }
  return null;
}

/**
 * POST /api/ops/dev-create-commission
 * Body: { userId: string, amount?: number, status?: string }
 *
 * Notes:
 * - We set `id` explicitly (in case your schema has no default).
 * - We set a minimal amount in the flexible `amount` field so finalizeCommission can pick it up.
 * - We default status to "APPROVED" since your auto-group logic checks for APPROVED commissions.
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

    const amount = Number(body.amount ?? 10.0);   // dollars
    const status = String(body.status ?? "APPROVED");

    // Build minimal data; cast to any so we can set flexible fields.
    const data: any = {
      id: crypto.randomUUID(),
      userId,
      amount,         // finalizeCommission will detect this and convert to cents
      status,         // many schemas use a string enum; adjust as needed
      // createdAt/updatedAt omitted unless your model requires them
    };

    const c = await prisma.commission.create({ data, select: { id: true, userId: true, status: true } });
    return NextResponse.json({ ok: true, commission: c });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "unknown_error" }, { status: 400 });
  }
}
