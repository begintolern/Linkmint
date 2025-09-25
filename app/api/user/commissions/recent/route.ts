// app/api/user/commissions/recent/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type MaybeSession = { user?: { id?: string | null } } | null;

export async function GET(_req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as MaybeSession;
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;

    const rows = await prisma.commission.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        amount: true,
        status: true,
        type: true,
        source: true,
        description: true,
        createdAt: true,
      },
    });

    const items = rows.map((r: typeof rows[number]) => ({
      id: r.id,
      amount: Number(r.amount),
      status: r.status,
      type: r.type,
      source: r.source,
      description: r.description,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    console.error("GET /api/user/commissions/recent error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
