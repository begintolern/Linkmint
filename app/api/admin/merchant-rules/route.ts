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
