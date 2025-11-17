// app/api/admin/merchant-rules/route.ts
export const runtime = "nodejs"; // critical: prevent Edge TLS issues
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Load recent merchant rules (no `select` to avoid schema mismatch)
    const rules = await prisma.merchantRule.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ ok: true, rules }, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/admin/merchant-rules error:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Optional: lock this to your admin account only
    // if (session.user.email !== "epo78741@yahoo.com") {
    //   return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    // }

    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!body.merchantName || !body.network || !body.domainPattern) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const rule = await prisma.merchantRule.create({
      data: {
        active: body.active ?? true,
        merchantName: body.merchantName,
        network: body.network,
        domainPattern: body.domainPattern,

        paramKey: body.paramKey ?? null,
        paramValue: body.paramValue ?? null,
        linkTemplate: body.linkTemplate ?? null,

        cookieWindowDays: body.cookieWindowDays ?? null,
        payoutDelayDays: body.payoutDelayDays ?? null,

        commissionType: body.commissionType ?? "PERCENT",
        commissionRate: body.commissionRate ?? null,

        calc: body.calc ?? null,
        rate: body.rate ?? null,
        notes: body.notes ?? null,

        importMethod: body.importMethod ?? "MANUAL",
        apiBaseUrl: body.apiBaseUrl ?? null,
        apiAuthType: body.apiAuthType ?? null,
        apiKeyRef: body.apiKeyRef ?? null,
        lastImportedAt: null,

        status: body.status ?? "approved",
        allowedRegions: body.allowedRegions ?? [],
        inactiveReason: body.inactiveReason ?? null,
        market: body.market ?? null,

        disallowed: body.disallowed ?? null,
        allowedSources: body.allowedSources ?? null,
        allowedCountries: body.allowedCountries ?? [],
        blockedCountries: body.blockedCountries ?? [],
      },
    });

    return NextResponse.json({ ok: true, rule }, { status: 200 });
  } catch (e: any) {
    console.error("POST /api/admin/merchant-rules error:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Server error" },
      { status: 500 }
    );
  }
}
