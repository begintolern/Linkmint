// app/api/merchant-rules/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * DTO returned to the client.
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

  // Optional text
  notes?: string | null;

  // Timestamps (optional for UI)
  createdAt?: string;
  updatedAt?: string;
};

/** Coerce unknown JSON-ish values into a clean string[] */
function asStringArray(v: unknown): string[] | null {
  if (v == null) return null;

  // Already an array
  if (Array.isArray(v)) {
    const out = v.map((x) => String(x).trim()).filter(Boolean);
    return out.length ? out : null;
  }

  // Objects: { sources: [...] } or flag maps { tiktok: true, reddit: true }
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    if (Array.isArray((obj as any).sources)) {
      const out = (obj as any).sources.map((x: unknown) => String(x).trim()).filter(Boolean);
      return out.length ? out : null;
    }
    const flags = Object.entries(obj)
      .filter(([, val]) => val === true || val === "true" || val === 1)
      .map(([k]) => k.trim())
      .filter(Boolean);
    return flags.length ? flags : null;
  }

  // Strings: try JSON parse, then CSV
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;

    // JSON array/object
    if ((s.startsWith("[") && s.endsWith("]")) || (s.startsWith("{") && s.endsWith("}"))) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          const out = parsed.map((x: unknown) => String(x).trim()).filter(Boolean);
          return out.length ? out : null;
        }
        if (parsed && typeof parsed === "object" && Array.isArray((parsed as any).sources)) {
          const out = (parsed as any).sources.map((x: unknown) => String(x).trim()).filter(Boolean);
          return out.length ? out : null;
        }
      } catch {
        // fall through to CSV
      }
    }

    // CSV / line-split
    const parts = s
      .split(/[,\n]/)
      .map((x) => x.replace(/^\s*[\[\s"]+/, "").replace(/[\]\s"]+\s*$/, "").trim())
      .map((x) => x.replace(/^"+|"+$/g, ""))
      .filter(Boolean);
    return parts.length ? parts : null;
  }

  return null;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

/**
 * GET /api/merchant-rules?activeOnly=true|false&market=PH|SG|US
 * Defaults: activeOnly=true, market="PH".
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const activeOnlyParam = url.searchParams.get("activeOnly");
    const marketParam = url.searchParams.get("market");

    const activeOnly = activeOnlyParam == null ? true : activeOnlyParam === "true";
    const market = (marketParam ?? "PH").toUpperCase();

    const where: any = activeOnly ? { active: true, market } : { market };

    const rows = await prisma.merchantRule.findMany({
      where,
      orderBy: [{ merchantName: "asc" }],
      select: {
        id: true,
        merchantName: true,
        active: true,
        network: true,
        domainPattern: true,

        // JSON fields in DB
        allowedSources: true,
        disallowed: true,

        // Commission/timing
        commissionType: true,
        commissionRate: true,
        cookieWindowDays: true,
        payoutDelayDays: true,

        // Optional text
        notes: true,

        // Metadata
        createdAt: true,
        updatedAt: true,
        market: true,
      },
    });

    const rules: MerchantRuleDTO[] = rows.map((m) => ({
      id: m.id,
      merchantName: m.merchantName,
      active: m.active,
      network: m.network ?? null,
      domainPattern: m.domainPattern ?? null,

      // Normalize JSON -> string[]
      allowedSources: asStringArray(m.allowedSources as unknown),
      disallowedSources: asStringArray((m as any).disallowed),

      // Prefer defaultCommissionRate if you add later; else commissionRate
      defaultCommissionRate: asNumber(
        ((m as any).defaultCommissionRate ?? (m as any).commissionRate) as unknown
      ),
      commissionType: (m.commissionType as unknown as string) ?? null,
      cookieWindowDays: asNumber(m.cookieWindowDays as unknown),
      payoutDelayDays: asNumber(m.payoutDelayDays as unknown),

      notes: m.notes ?? null,

      createdAt: m.createdAt?.toISOString?.(),
      updatedAt: m.updatedAt?.toISOString?.(),
    }));

    return NextResponse.json({ ok: true, rules }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "API_ERROR", message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/merchant-rules
 * Create a new merchant rule.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const merchantName = String(body.merchantName ?? "").trim();
    if (!merchantName) {
      return NextResponse.json(
        { ok: false, error: "MISSING_NAME" },
        { status: 400 }
      );
    }

    const data = {
      merchantName,
      active: true,
      market: "PH",

      network: body.network ?? null,
      domainPattern: body.domainPattern ?? null,

      // match existing DB field names
      allowedSources: asStringArray(body.allowedSources),
      disallowed: asStringArray(body.disallowedSources),

      commissionType: body.commissionType ?? "PERCENT",
      commissionRate: asNumber(body.commissionRate),

      cookieWindowDays: asNumber(body.cookieWindowDays),
      payoutDelayDays: asNumber(body.payoutDelayDays),

      notes: body.notes ?? null,
    };

    // cast as any to avoid TS complaining about JSON vs string[] details
    const created = await prisma.merchantRule.create({ data: data as any });

    return NextResponse.json({ ok: true, rule: created }, { status: 200 });
  } catch (err: any) {
    console.error("[merchant-rules][POST] error:", err);
    return NextResponse.json(
      { ok: false, error: "POST_ERROR", message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
