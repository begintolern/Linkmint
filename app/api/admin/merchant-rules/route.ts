// app/api/admin/merchant-rules/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";

// GET all merchant rules
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const rules = await prisma.merchantRule.findMany({
      orderBy: { merchantName: "asc" },
    });
    return NextResponse.json({ success: true, rules });
  } catch (err: any) {
    console.error("GET /merchant-rules failed:", err);
    return NextResponse.json(
      { error: "GET failed", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

// POST create a new merchant rule
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const data = await req.json();

    const created = await prisma.merchantRule.create({
      data: {
        active: data.active ?? true,
        merchantName: data.merchantName,
        network: data.network,
        domainPattern: data.domainPattern,
        paramKey: data.paramKey ?? null,
        paramValue: data.paramValue ?? null,
        linkTemplate: data.linkTemplate ?? null,
        allowedSources: data.allowedSources ?? [],
        calc: data.calc ?? null,
        rate: data.rate ?? null,
        notes: data.notes ?? null,
      },
    });

    return NextResponse.json({ success: true, created });
  } catch (err: any) {
    console.error("POST /merchant-rules failed:", err);
    return NextResponse.json(
      { error: "POST failed", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
