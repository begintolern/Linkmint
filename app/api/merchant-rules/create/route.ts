// app/api/merchant-rules/create/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/merchant-rules/create
 * Creates a new merchant rule.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const created = await prisma.merchantRule.create({
      data: {
        merchantName: body.merchantName,
        network: body.network ?? null,
        domainPattern: body.domainPattern ?? null,
        active: body.active ?? true,
        status: body.status ?? "PENDING",
        commissionType: body.commissionType ?? null,
        commissionRate: body.commissionRate
          ? Number(body.commissionRate)
          : null,
        allowedSources: body.allowedSources ?? [],
        disallowed: body.disallowed ?? [],
        notes: body.notes ?? null,
      },
    });

    return NextResponse.json({ success: true, rule: created });
  } catch (err: any) {
    console.error("merchant-rules/create error:", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
