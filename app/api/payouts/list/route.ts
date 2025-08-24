// app/api/payouts/list/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true, role: true },
    });
    if (!me) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Optional status filter
    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // PENDING | PROCESSING | PAID | FAILED
    const isAdmin = (me.role ?? "").toUpperCase() === "ADMIN";

    const where: any = {};
    if (!isAdmin) {
      // regular users only see their own payouts
      where.userId = me.id;
    }
    if (status) {
      where.statusEnum = status as any;
    }

    const rows = await prisma.payout.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        createdAt: true,
        provider: true,
        statusEnum: true,
        netCents: true,       // Int (exists in your schema)
        amount: true,         // Float (fallback if needed)
        receiverEmail: true,
        userId: true,
      },
    });

    // Normalize shape for UI
    const out = rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      provider: r.provider,
      statusEnum: r.statusEnum,
      netCents: r.netCents ?? null,
      amount: r.amount ?? null,
      destination: r.receiverEmail ?? null,
      // Keep consistent keys even without the join
      email: null as string | null,
      name: null as string | null,
    }));

    return NextResponse.json({ ok: true, rows: out });
  } catch (e) {
    console.error("GET /api/payouts/list error:", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
