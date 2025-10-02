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
    // Use no 'select' so we don't crash if a field is missing in some schema/version
    const rows = await prisma.merchantRule.findMany({
      orderBy: { merchantName: "asc" }, // safe ordering across versions
    });

    const merchants = rows.map((r: any) => ({
      // Core identifiers/timestamps
      id: r.id,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,

      // Core display fields
      active: !!r.active,
      merchantName: r.merchantName,
      network: r.network ?? null,
      domainPattern: r.domainPattern ?? null,

      // Region / status (may be null on older rows)
      market: r.market ?? null,      // e.g., "PH", "US", "GLOBAL"
      status: r.status ?? null,      // e.g., "PENDING", "ACTIVE"

      // Rules
      cookieWindowDays: r.cookieWindowDays ?? null,
      payoutDelayDays: r.payoutDelayDays ?? null,

      // Commission (support both percent-string style and bps fallback)
      commissionType: r.commissionType ?? null, // e.g., "PERCENT"
      commissionRate: r.commissionRate ?? null, // e.g., "0.06"
      baseCommissionBps: r.baseCommissionBps ?? null, // optional legacy/fallback

      // Sources (JSON arrays in some schemas)
      allowedSources: toStringArray(r.allowedSources),
      disallowedSources: toStringArray((r as any).disallowedSources),

      // Notes
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
