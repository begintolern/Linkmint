export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { CommissionCalc, ImportMethod } from "@prisma/client";

// helpers
function asString(v: unknown): string | null { if (typeof v === "string") return v.trim(); return null; }
function asBool(v: unknown, fallback = true): boolean { return typeof v === "boolean" ? v : fallback; }
function asInt(v: unknown): number | null { const n = Number(v); return Number.isFinite(n) ? Math.trunc(n) : null; }
function asFloat(v: unknown): number | null { const n = Number(v); return Number.isFinite(n) ? n : null; }
function asJson(v: unknown): any | null { if (v == null) return null; if (typeof v === "object") return v; try { return JSON.parse(String(v)); } catch { return null; } }
function clampRate(rate: number | null): number | null { if (rate == null) return null; if (rate < 0) return 0; if (rate > 100) return 100; return rate; }

// POST /api/merchant-rules
export async function POST(req: Request) {
  try {
    // lazy import prisma; if this fails we return JSON instead of 502
    const { prisma } = await import("@/lib/db");

    const body = await req.json().catch(() => ({}));
    const merchantName = asString(body.merchantName);
    if (!merchantName) {
      return NextResponse.json({ success: false, error: "merchantName is required" }, { status: 400 });
    }

    const network = asString(body.network) ?? "Unknown";
    const domainPattern = asString(body.domainPattern) ?? "*";
    const active = asBool(body.active, true);
    const paramKey = asString(body.paramKey);
    const paramValue = asString(body.paramValue);
    const linkTemplate = asString(body.linkTemplate);
    const allowedSources = asJson(body.allowedSources) ?? {};
    const disallowed = asJson(body.disallowed) ?? {};
    const cookieWindowDays = asInt(body.cookieWindowDays);
    const payoutDelayDays = asInt(body.payoutDelayDays);

    const commissionType: CommissionCalc =
      (asString(body.commissionType)?.toUpperCase() === "FIXED")
        ? CommissionCalc.FIXED
        : CommissionCalc.PERCENT;

    const importMethod: ImportMethod =
      (asString(body.importMethod)?.toUpperCase() === "API")
        ? ImportMethod.API
        : ImportMethod.MANUAL;

    const rate = clampRate(asFloat(body.rate));
    const commissionRate =
      typeof body.commissionRate === "string" || typeof body.commissionRate === "number"
        ? (body.commissionRate as any)
        : null;

    const calc = asString(body.calc);
    const notes = asString(body.notes);
    const apiBaseUrl = asString(body.apiBaseUrl);
    const apiAuthType = asString(body.apiAuthType);
    const apiKeyRef = asString(body.apiKeyRef);

    const created = await prisma.merchantRule.create({
      data: {
        active,
        merchantName,
        network,
        domainPattern,
        paramKey: paramKey ?? null,
        paramValue: paramValue ?? null,
        linkTemplate: linkTemplate ?? null,
        allowedSources,
        disallowed,
        cookieWindowDays,
        payoutDelayDays,
        commissionType,
        commissionRate,
        calc: calc ?? null,
        rate: rate ?? null,
        notes: notes ?? null,
        importMethod,
        apiBaseUrl: apiBaseUrl ?? null,
        apiAuthType: apiAuthType ?? null,
        apiKeyRef: apiKeyRef ?? null,
      },
    });

    return NextResponse.json({ success: true, rule: created });
  } catch (e: any) {
    console.error("POST /merchant-rules fatal:", e?.message || e);
    return NextResponse.json(
      { success: false, error: "merchant_rules_failed", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}

// GET /api/merchant-rules
export async function GET(req: Request) {
  try {
    const { prisma } = await import("@/lib/db");
    const { searchParams } = new URL(req.url);
    const take = Math.min(Number(searchParams.get("take") ?? 20), 100);
    const skip = Math.max(Number(searchParams.get("skip") ?? 0), 0);

    const rules = await prisma.merchantRule.findMany({ orderBy: { merchantName: "asc" }, skip, take });
    const total = await prisma.merchantRule.count();
    return NextResponse.json({ success: true, total, rules, skip, take });
  } catch (e: any) {
    console.error("GET /merchant-rules fatal:", e?.message || e);
    return NextResponse.json(
      { success: false, error: "merchant_rules_list_failed", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}
