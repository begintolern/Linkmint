// app/api/payouts/available/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type CommissionRow = {
  id: string;
  amount: number;
  status: string;        // ← normalize to string to avoid enum drift
  createdAt: string;
  description: string | null;
  source: string | null;
};

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { id?: string } } | null;
    const userId = session?.user?.id ?? null;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rows = await prisma.commission.findMany({
      where: { userId, status: "APPROVED" as any, paidOut: false }, // guard via string
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        description: true,
        source: true,
      },
    });

    const commissions: CommissionRow[] = rows.map((c) => ({
      id: c.id,
      amount: Number(c.amount),
      status: String(c.status),
      createdAt: c.createdAt.toISOString(),
      description: c.description ?? null,
      source: c.source ?? null,
    }));

    return NextResponse.json({ success: true, rows: commissions });
  } catch (e) {
    console.error("GET /api/payouts/available error:", e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
