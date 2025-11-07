// app/api/admin/payouts/list/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * NOTE:
 * Some environments have PayoutStatus = {PENDING, PROCESSING, PAID, FAILED}
 * Others may still have a legacy enum that includes QUEUED/SUBMITTED.
 * To keep builds green across both, we type status as `string` and normalize.
 */

type Row = {
  id: string;
  createdAt: string;
  feeCents: number;
  netCents: number;
  provider: string | null;
  status: string; // <- loosened, accepts PENDING/PROCESSING/PAID/FAILED/QUEUED/SUBMITTED
  user: { name: string | null; email: string | null };
};

const ALLOWED = new Set([
  "PENDING",
  "PROCESSING",
  "PAID",
  "FAILED",
  "QUEUED",
  "SUBMITTED",
]);

function normStatus(s: any): string {
  const v = String(s || "").toUpperCase();
  return ALLOWED.has(v) ? v : "PENDING";
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const statusQ = url.searchParams.get("status");
    const take = Math.max(1, Math.min(Number(url.searchParams.get("take") || 100), 500));

    const where: any = {};
    if (statusQ && ALLOWED.has(statusQ.toUpperCase())) {
      // DB field is `statusEnum` (enum). We filter via string compare.
      where.statusEnum = statusQ.toUpperCase();
    }

    const rows = await prisma.payout.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        createdAt: true,
        feeCents: true,
        netCents: true,
        provider: true,
        statusEnum: true, // enum in DB; we’ll normalize to string
        user: { select: { name: true, email: true } },
      },
    });

    const out: Row[] = rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      feeCents: r.feeCents ?? 0,
      netCents: r.netCents ?? 0,
      provider: (r.provider as any) ?? null,
      status: normStatus(r.statusEnum as any),
      user: {
        name: r.user?.name ?? null,
        email: r.user?.email ?? null,
      },
    }));

    return NextResponse.json({ ok: true, total: out.length, rows: out });
  } catch (err) {
    console.error("admin payouts list error:", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
