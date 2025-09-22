export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * DTO returned to the frontend.
 * Make sure these match what your Merchant Directory page expects.
 */
type MerchantRuleDTO = {
  id: string;
  merchantName: string;
  active: boolean;
  network: string | null;
  domainPattern: string | null;

  // JSON fields normalized for the UI:
  allowedSources: string[] | null;
  disallowedSources: string[] | null;

  // Commission + timing hints (nullable if not set):
  defaultCommissionRate: number | null;
  commissionType: string | null;
  cookieWindowDays: number | null;
  payoutDelayDays: number | null;

  // Optional flags/text:
  isGreyListed?: boolean | null;
  notes?: string | null;

  // Timestamps (optional for UI)
  createdAt?: string;
  updatedAt?: string;
};

/** Small helpers to coerce unknown JSON from Prisma into arrays/numbers safely */
function asStringArray(v: unknown): string[] | null {
  if (Array.isArray(v)) {
    return v.map((x) => (typeof x === "string" ? x : String(x))).filter(Boolean);
  }
  if (v == null) return null;
  // Some older seeds may store CSV strings; support that too:
  if (typeof v === "string") {
    const parts = v.split(",").map((s) => s.trim()).filter(Boolean);
    return parts.length ? parts : null;
  }
  return null;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return null;
}

/**
 * GET /api/merchant-rules/list?activeOnly=true|false
 * Defaults to activeOnly=true.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const activeOnlyParam = url.searchParams.get("activeOnly");
    const activeOnly = activeOnlyParam == null ? true : activeOnlyParam === "true";

    const where = activeOnly ? { active: true } : {};

    const rows = await prisma.merchantRule.findMany({
      where,
      orderBy: [{ merchantName: "asc" }],
    });

    const merchants: MerchantRuleDTO[] = rows.map((m) => ({
      id: m.id,
      merchantName: m.merchantName,
      active: m.active,
      network: m.network,
      domainPattern: m.domainPattern,

      allowedSources: asStringArray(m.allowedSources as unknown),
      disallowedSources: asStringArray((m as any)?.disallowedSources),

      defaultCommissionRate: asNumber(((m as any).defaultCommissionRate ?? (m as any).commissionRate) as unknown),
      commissionType: (m.commissionType as unknown as string) ?? null,
      cookieWindowDays: asNumber(m.cookieWindowDays as unknown),
      payoutDelayDays: asNumber(m.payoutDelayDays as unknown),

      isGreyListed: (m as any).isGreyListed ?? null,
      notes: m.notes ?? null,

      createdAt: m.createdAt?.toISOString?.() ?? undefined,
      updatedAt: m.updatedAt?.toISOString?.() ?? undefined,
    }));

    return NextResponse.json({ ok: true, merchants }, { status: 200 });
  } catch (err: any) {
    // Surface the message while avoiding leaking internals
    return NextResponse.json(
      { ok: false, error: "API_ERROR", message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
