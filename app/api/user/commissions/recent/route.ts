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
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id as string;

    // Pull last 20 payouts for this user (covers IA + other networks)
    const rows = await prisma.payout.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        // if you later add fields like merchantName / network / description,
        // we can include them here
      },
    });

    const items = rows.map((r: (typeof rows)[number]) => ({
      id: r.id,
      amount: Number(r.amount),          // Prisma.Decimal -> number
      status: r.status,                  // "pending" | "approved" | "paid"
      type: null as string | null,       // placeholder to keep response shape
      source: null as string | null,     // can become "Involve Asia" / "Accesstrade" later
      description: null as string | null,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    console.error("GET /api/user/commissions/recent error:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
