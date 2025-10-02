// app/api/merchant-rules/list/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Helper: normalize Prisma JsonValue to string[] | null
function toStringArray(value: unknown): string[] | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (typeof value === "string") return [value];
  return null;
}

export async function GET() {
  try {
    const rows = await prisma.merchantRule.findMany({
      orderBy: { merchantName: "asc" },
    });

    const merchants = rows.map((r: any) => ({
      id: r.id,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,

      active: !!r.active,
      merchantName: r.merchantName,
      network: r.network ?? null,
      domainPattern: r.domainPattern ?? null,

      // ✅ always include market & status
      market: r.market ?? null,
      status: r.status ?? null,

      cookieWindowDays: r.cookieWindowDays ?? null,
      payoutDelayDays: r.payoutDelayDays ?? null,

      // Commission (new style + legacy fallback)
      commissionType: r.commissionType ?? null,
      commissionRate: r.commissionRate ?? null,
      baseCommissionBps: r.baseCommissionBps ?? null,

      // Sources (optional JSON[] in some schemas)
      allowedSources: toStringArray(r.allowedSources),
      disallowedSources: toStringArray((r as any).disallowedSources),

      notes: r.notes ?? null,
    }));

    return NextResponse.json({ ok: true, merchants });
  } catch (err) {
    console.error("[/api/merchant-rules/list] error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load merchant rules." },
      { status: 500 }
    );
  }
}
