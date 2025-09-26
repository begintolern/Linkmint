// app/api/merchant-rules/list/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Helper: normalize Prisma JsonValue to string[] | null
function toStringArray(value: unknown): string[] | null {
  if (value == null) return null;
  // If it's already an array, stringify elements
  if (Array.isArray(value)) return value.map((v) => String(v));
  // Single string (DB may have old data)
  if (typeof value === "string") return [value];
  // Anything else (object/number/bool) → null to be safe
  return null;
}

export async function GET() {
  try {
    // Avoid 'select' so this won't type-error if a field is absent in some schema versions
    const rows = await prisma.merchantRule.findMany({
      orderBy: { merchantName: "asc" },
    });

    const merchants = rows.map((r: any) => ({
      id: r.id,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      merchantName: r.merchantName,
      active: r.active,
      network: r.network ?? null,
      domainPattern: r.domainPattern ?? null,

      // IMPORTANT: normalize JSON → string[] | null
      allowedSources: toStringArray(r.allowedSources),
      // Some repos don’t have this column yet; handle gracefully
      disallowedSources: toStringArray((r as any).disallowedSources),

      cookieWindowDays: r.cookieWindowDays ?? null,
      payoutDelayDays: r.payoutDelayDays ?? null,
      baseCommissionBps: r.baseCommissionBps ?? null,
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
