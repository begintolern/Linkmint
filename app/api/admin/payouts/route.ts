// app/api/admin/payouts/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const commissions = await prisma.commission.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const payouts = commissions.map((c: any) => ({
      id: c.id,
      amount: Number(c.amount ?? 0),
      status: c.status ?? "pending",
      createdAt: c.createdAt,
      user: { email: c.user?.email ?? "" },
    }));

    return NextResponse.json({ payouts });
  } catch (err) {
    console.error("Error loading payouts:", err);
    return NextResponse.json({ payouts: [], error: "Failed to load payouts" }, { status: 500 });
  }
}
