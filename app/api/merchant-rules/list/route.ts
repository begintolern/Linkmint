// app/api/merchant-rules/list/route.ts
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

/** Robustly coerce unknown JSON-ish values into a clean string[] */
function asStringArray(v: unknown): string[] | null {
  // Helper: trim quotes/brackets from a single token
  const cleanToken = (s: string) =>
    s.replace(/^\s*[\[\s"]+/, "").replace(/[\]\s"]+\s*$/, "").trim();

  // If it's already an array…
  if (Array.isArray(v)) {
    const arr = v as unknown[];
    if (arr.length && typeof arr[0] === "string" && typeof arr[arr.length - 1] === "string") {
      const first = (arr[0] as string).trim();
      const last = (arr[arr.length - 1] as string).trim();

      // Case: array holds JSON fragments like ['["A"', '"B"', '"C"]']
      if (/^\[/.test(first) && /\]$/.test(last)) {
        try {
          const joined = (arr as string[]).join("");
          const parsed = JSON.parse(joined);
          if (Array.isArray(parsed)) {
            return parsed.map((x) => String(x).trim()).filter(Boolean);
          }
        } catch {
          // fall through to cleaning tokens
        }
      }
    }

    // Generic clean of stringy entries
    const out = arr
      .map((x) => (typeof x === "string" ? cleanToken(x) : String(x)))
      .map((s) => s.replace(/^"+|"+$/g, "")) // strip extra quotes if any
      .filter(Boolean);

    return out.length ? out : null;
  }

  if (v == null) return null;

  // If it's a plain object, look for { sources: [...] } or truthy flags
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    if (Array.isArray((obj as any).sources)) {
      const arr = (obj as any).sources as unknown[];
      const out = arr.map((x) => String(x).trim()).filter(Boolean);
      return out.length ? out : null;
    }
    // { tiktok: true, reddit: true } → ["tiktok","reddit"]
    const flags = Object.entries(obj)
      .filter(([, val]) => val === true)
      .map(([key]) => key);
    return flags.length ? flags : null;
  }

  // Strings: try JSON, then CSV fallback
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;

    // Try to parse JSON array/object
    if ((s.startsWith("[") && s.endsWith("]")) || (s.startsWith("{") && s.endsWith("}"))) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          return parsed.map((x) => String(x).trim()).filter(Boolean);
        }
        if (parsed && typeof parsed === "object" && Array.isArray((parsed as any).sources)) {
          return (parsed as any).sources.map((x: unknown) => String(x).trim()).filter(Boolean);
        }
      } catch {
        // fall back to CSV parsing
      }
    }

    // CSV / line-split fallback, also cleaning stray quotes/brackets
    const parts = s
      .split(/[,\n]/)
      .map(cleanToken)
      .map((x) => x.replace(/^"+|"+$/g, ""))
      .filter(Boolean);
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
 * GET /api/merchant-rules/list?activeOnly=true|false&market=PH|SG|US
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

    // No 'select' here — we normalize below with safe cast/guards
    const rows = await prisma.merchantRule.findMany({
      where,
      orderBy: [{ merchantName: "asc" }],
    });

    const merchants: MerchantRuleDTO[] = rows.map((m: any) => ({
      id: m.id,
      merchantName: m.merchantName,
      active: m.active,
      network: m.network ?? null,
      domainPattern: m.domainPattern ?? null,

      // Normalize list-ish fields regardless of how they were stored
      allowedSources: asStringArray(m.allowedSources),
      // DB uses JSON column `disallowed`; normalize to string[]
      disallowedSources: asStringArray(m.disallowed),

      // Commission/timing
      defaultCommissionRate: asNumber(m.defaultCommissionRate ?? m.commissionRate),
      commissionType: m.commissionType ?? null,
      cookieWindowDays: asNumber(m.cookieWindowDays),
      payoutDelayDays: asNumber(m.payoutDelayDays),

      // Optional flags/text — tolerate missing columns
      isGreyListed: typeof m.isGreyListed === "boolean" ? m.isGreyListed : null,
      notes: m.notes ?? null,

      createdAt: m.createdAt?.toISOString?.(),
      updatedAt: m.updatedAt?.toISOString?.(),
    }));

    return NextResponse.json({ ok: true, merchants }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "API_ERROR", message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
