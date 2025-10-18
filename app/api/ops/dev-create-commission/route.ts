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
 * Body: { userId: string, amount?: number, status?: string, type?: string }
 * Defaults: amount=$10.00, status="APPROVED", type="SALE"
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

    const amount = Number(body.amount ?? 10.0);         // dollars
    const status = String(body.status ?? "APPROVED");   // adjust if your enum differs
    const type = String(body.type ?? "SALE");           // ✅ required by your schema

    // Minimal payload; include id explicitly in case schema lacks default
    const data: any = {
      id: crypto.randomUUID(),
      userId,
      amount,   // finalizeCommission reads this and converts to cents
      status,
      type,     // ✅ REQUIRED
      // createdAt/updatedAt only if your schema requires them:
      // createdAt: new Date(),
      // updatedAt: new Date(),
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
