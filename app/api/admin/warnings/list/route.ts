// app/api/admin/warnings/list/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(
      1000,
      Math.max(1, parseInt(url.searchParams.get("limit") || "200", 10) || 200)
    );

    // Optional future filters (no-op for now; UI filters are client-side)
    // const userId = url.searchParams.get("userId") || undefined;
    // const type = url.searchParams.get("type") || undefined;

    const rows = await prisma.complianceEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        userId: true,
        type: true,
        message: true,
        createdAt: true,
        meta: true,
      },
    });

    // Normalize to the shape the /admin/warnings page expects
    const warnings = rows.map((r) => ({
      id: r.id,
      userId: r.userId ?? null,
      type: r.type ?? null,
      message: r.message ?? null,
      createdAt: r.createdAt.toISOString(),
      evidence: r.meta ?? null,
    }));

    return NextResponse.json({ ok: true, count: warnings.length, warnings });
  } catch (e: any) {
    console.error("[/api/admin/warnings/list] error:", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
