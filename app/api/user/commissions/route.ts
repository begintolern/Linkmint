// app/api/user/commissions/route.ts
export const runtime = "nodejs";           // Fix TLS cert issue by forcing Node runtime
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

    const me = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true },
    });
    if (!me) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Return recent commissions for the logged-in user
    const rows = await prisma.commission.findMany({
      where: { userId: me.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        createdAt: true,
        status: true,
      },
    });

    return NextResponse.json({ ok: true, rows }, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/user/commissions error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
