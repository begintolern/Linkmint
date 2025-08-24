// app/api/admin/payout-logs-ui/route.ts
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
      select: { id: true, role: true },
    });
    if (!me || (me.role ?? "").toUpperCase() !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // ⬇️ Prisma call happens INSIDE the handler (not at module top-level)
    const logs = await prisma.payout.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        createdAt: true,
        provider: true,
        statusEnum: true,
        netCents: true,
        receiverEmail: true,
        userId: true,
      },
    });

    return NextResponse.json({ ok: true, rows: logs });
  } catch (e) {
    console.error("GET /api/admin/payout-logs-ui error:", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
